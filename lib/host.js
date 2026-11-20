/**
 * 起笔插件（@local/dsh-qibi）Host 半边。
 *
 * 定位：把**起笔的能力**接进 DSH，而不是把起笔的界面搬进来。
 * - 数据面：直连 `novelforge.db`（WAL），读写都遵守起笔自己的约定；
 * - 通道：共享 `/api` 通道上的精确路由 `/api/qibi`，供 DSH 面板取数（Web 与桌面版通用、自带浏览器鉴权）；
 * - 能力面：`qibi_*` 工具 + 一段「当前选中章节」的系统提示，让 Agent 读写同一份正典。
 *
 * 判断后**不移植**的能力（DSH 侧已有等价物或与本地单人创作无关）：
 * 公共书城/阅读器/注册登录、管理员与公网隧道、MCP 客户端管理、起笔自己的模型调用层（生成交给 DSH 的 Agent）、
 * 地图可视化编辑器、作者蒸馏的三阶段 SSE 流程。
 */

import fs from 'node:fs'
import path from 'node:path'
import { ensureEmptyDatabase } from './database.js'
// Reload the business modules together with this activation generation.
const revision = new URL(import.meta.url).searchParams.get('rev') ?? 'initial'
const { buildContext, buildPrompts, listModes, streamText, getReasoningInfo } = await import(`./ai.js?rev=${encodeURIComponent(revision)}`)
const { QibiError, QibiStore, toPublicError, defaultDataDir } = await import(`./store.js?rev=${encodeURIComponent(revision)}`)
const { registerTools } = await import(`./tools.js?rev=${encodeURIComponent(revision)}`)
const { generateCharacterCandidates } = await import(`./character-ai.js?rev=${encodeURIComponent(revision)}`)
const { createContinuityOrganizer } = await import(`./continuity-organizer.js?rev=${encodeURIComponent(revision)}`)

/**
 * 从宿主上下文里安全地取一个可选服务。
 *
 * `llm` 与 `agentDefaultModel` 不在插件 inject 清单里（宿主不一定有，列了反而可能让插件加载失败），
 * 所以用 ctx.get / 属性两种方式都试一遍，任何一种失败都当「服务不存在」处理。
 */
function getService(ctx, name) {
  try {
    const viaGet = typeof ctx.get === 'function' ? ctx.get(name) : undefined
    if (viaGet) return viaGet
  } catch {
    // 该服务不在当前作用域。
  }
  try {
    const viaProperty = ctx[name]
    if (viaProperty) return viaProperty
  } catch {
    // 同上。
  }
  return null
}

/** 面板与宿主之间的路径（相对文档根，客户端不带前导斜杠）。 */
export const ROUTE_PATH = '/api/qibi'

/** AI 生成走的独立路由：响应是 SSE 流。 */
export const AI_ROUTE_PATH = '/api/qibi/ai'

/** Data-location settings use the Host configuration editor, never a hand-written profile patch. */
export function createDataSettings(ctx, config, store) {
  const editor = getService(ctx, 'configEditor')
  let entry
  try { entry = ctx.fiber?.entry } catch { entry = undefined }
  const canSave = Boolean(entry && editor && typeof editor.edit === 'function')
  const picker = getService(ctx, 'directoryPickerController')
  let saving = false

  return {
    info() {
      const status = store.status()
      return {
        dataDir: store.dataDir,
        dbPath: store.dbPath,
        defaultDataDir: defaultDataDir(),
        exists: status.exists && !status.error,
        canSave,
        canPick: typeof picker?.pick === 'function',
        userId: status.user?.id ?? null,
        users: status.users,
      }
    },
    async pick(signal) {
      if (typeof picker?.pick !== 'function') throw new QibiError('PICKER_UNAVAILABLE', '此宿主没有可用的目录选择器，请在输入框填写目录。')
      return { path: await picker.pick(signal) }
    },
    async configure(input) {
      if (!canSave) throw new QibiError('SETTINGS_UNAVAILABLE', '当前宿主没有配置保存服务，无法保存数据位置。')
      if (saving) throw new QibiError('SETTINGS_BUSY', '正在保存数据位置，请等待完成。')
      const raw = typeof input?.dataDir === 'string' ? input.dataDir.trim() : ''
      if (!raw || !path.isAbsolute(raw)) throw new QibiError('BAD_DATA_DIR', '请填写完整的绝对目录，例如 D:\\dsh-qibi\\data。')
      let dataDir = path.normalize(raw)
      if (path.basename(dataDir).toLowerCase() === 'novelforge.db') dataDir = path.dirname(dataDir)
      if (dataDir === path.parse(dataDir).root) throw new QibiError('BAD_DATA_DIR', '请使用盘符下的专用文件夹，不要直接使用磁盘根目录。')
      const mode = input?.mode
      if (mode !== 'create' && mode !== 'existing') throw new QibiError('BAD_ARGUMENT', '请选择新建空白库或连接已有库。')
      const dbPath = path.join(dataDir, 'novelforge.db')
      if (mode === 'create' && !store.configWritable) throw new QibiError('READ_ONLY', '插件被配置为只读，不能创建数据库；可以连接已有数据库。')
      if (mode === 'create' && fs.existsSync(dbPath)) throw new QibiError('DB_EXISTS', '此目录已有数据库，未覆盖它。请改选新目录，或使用“连接已有库”。')
      if (mode === 'existing' && !fs.existsSync(dbPath)) throw new QibiError('NO_DB', '此目录没有 novelforge.db；需要新建时请选择“新建空白库”。')
      const userId = input?.userId == null || input.userId === '' ? null : Number(input.userId)
      if (userId !== null && (!Number.isSafeInteger(userId) || userId <= 0)) throw new QibiError('BAD_ARGUMENT', '作者 ID 必须是正整数。')

      saving = true
      try {
        // Create mode must win the exclusive file creation even if another writer raced the preflight.
        if (mode === 'create') {
          try { ensureEmptyDatabase(dataDir, { mustCreate: true }) }
          catch (error) { throw new QibiError(error.code ?? 'DB_CREATE_FAILED', error.message, error.details ?? {}) }
        }
        const prospective = new QibiStore({ ...config, dataDir, userId: userId ?? undefined, allowWrite: false })
        let status
        try { status = prospective.status() } finally { prospective.dispose() }
        if (status.error) throw new QibiError(status.error.code, status.error.message, status.error.details ?? {})
        if (userId !== null && !status.users.some(row => row.id === userId && !row.disabled)) {
          throw new QibiError('USER_NOT_FOUND', '所选数据库中没有这个可用的作者 ID。')
        }
        await editor.edit(entry, current => {
          const next = { ...current, dataDir }
          // IDs from the previous database must not leak into the new one.
          if (userId === null) delete next.userId
          else next.userId = userId
          return next
        })
        return { saved: true, dataDir, dbPath }
      } finally {
        saving = false
      }
    },
  }
}

/**
 * 处理浏览器端的一次调用。
 * @param {QibiStore} store 数据层。
 * @param {string} endpoint 端点名。
 * @param {unknown} payload 调用参数。
 */
async function dispatch(store, endpoint, payload, env) {
  const args = payload && typeof payload === 'object' ? payload : {}
  switch (endpoint) {
    case 'dataSettings':
      return env.dataSettings.info()
    case 'pickDataDir':
      return env.dataSettings.pick(env.signal)
    case 'saveDataSettings':
      return env.dataSettings.configure(args)
    case 'status':
      return store.status()
    case 'novels':
      return { user: store.user(), novels: store.novels() }
    case 'createNovel':
      return store.createNovel(args)
    case 'updateNovel':
      return store.updateNovel(args)
    case 'deleteNovel':
      return store.deleteNovel(args)
    case 'chapters':
      return { novelId: args.novelId ?? store.selection.novelId, chapters: store.chapters(args.novelId ?? store.selection.novelId) }
    case 'chapter':
      return { chapter: store.chapter(args.chapterId) }
    case 'save':
      return store.saveChapter(args)
    case 'addRevision':
      return store.addRevision(args)
    case 'createChapter':
      return store.createChapter(args)
    case 'updateChapter':
      return store.updateChapter(args)
    case 'deleteChapter':
      return store.deleteChapter(args)
    case 'moveChapter':
      return store.moveChapter(args)
    case 'characterAi':
      return env.characterAi.generate(args, env.signal)
    case 'importCharacters':
      return store.importCharacters(args)
    case 'characters':
      return { characters: store.characters(args.novelId ?? store.selection.novelId) }
    case 'createCharacter':
      return store.createCharacter(args)
    case 'updateCharacter':
      return store.updateCharacter(args)
    case 'deleteCharacter':
      return store.deleteCharacter(args)
    case 'characterState':
      return store.characterState(args.characterId)
    case 'updateCharacterState':
      return store.updateCharacterState(args)
    case 'outline':
      return { outline: store.outline(args.novelId ?? store.selection.novelId) }
    case 'createOutline':
      return store.createOutline(args)
    case 'updateOutline':
      return store.updateOutline(args)
    case 'deleteOutline':
      return store.deleteOutline(args)
    case 'volumes':
      return { volumes: store.volumes(args.novelId ?? store.selection.novelId) }
    case 'createVolume':
      return store.createVolume(args)
    case 'updateVolume':
      return store.updateVolume(args)
    case 'revisions':
      return { revisions: store.revisions(args.chapterId) }
    case 'restoreRevision':
      return store.restoreRevision(args)
    case 'organizeContinuity':
      return env.continuityOrganizer.organize(args, env.signal)
    case 'chapterSummary':
      return { summary: store.chapterSummary(args.chapterId) }
    case 'updateChapterSummary':
      return { summary: store.upsertChapterSummary(args) }
    case 'writerState':
      return { writerState: store.writerState(args.novelId ?? store.selection.novelId) }
    case 'updateWriterState':
      return { writerState: store.updateWriterState(args) }
    case 'search':
      return store.search(args.query, args.novelId ?? null)
    case 'kbQuery':
      return { hits: store.kbQuery(args.novelId ?? store.selection.novelId, args.query, args.limit) }
    case 'kbStats':
      return store.kbStats(args.novelId ?? store.selection.novelId)
    case 'reindexNovel':
      return store.reindexNovel(args.novelId ?? store.selection.novelId)
    case 'export':
      return store.exportNovel(args)
    case 'distilledAuthors':
      return store.distilledAuthors()
    case 'distilledAuthor':
      return store.distilledAuthor(args.authorId)
    case 'createDistilledAuthor':
      return store.createDistilledAuthor(args)
    case 'updateDistilledAuthor':
      return store.updateDistilledAuthor(args)
    case 'deleteDistilledAuthor':
      return store.deleteDistilledAuthor(args)
    case 'initDistilledSource':
      return store.initDistilledSource(args)
    case 'appendDistilledSource':
      return store.appendDistilledSource(args)
    case 'completeDistilledSource':
      return store.completeDistilledSource(args)
    case 'addDistilledText':
      return store.addDistilledText(args)
    case 'deleteDistilledSource':
      return store.deleteDistilledSource(args)
    case 'distilledMaterial':
      return store.distilledMaterial(args.authorId)
    case 'saveDistilledVersion':
      return store.saveDistilledVersion(args)
    case 'distilledVersions':
      return store.distilledVersions(args.authorId)
    case 'rollbackDistilledVersion':
      return store.rollbackDistilledVersion(args)
    case 'bindDistilledAuthor':
      return store.bindDistilledAuthor(args)
    case 'aiInfo': {
      const selection = resolveSelection(env.ctx, env.config)
      const llm = getService(env.ctx, 'llm')
      return {
        available: Boolean(selection && llm),
        model: selection ? `${selection.provider}/${selection.model}` : '',
        reasoning: await getReasoningInfo(llm, selection, env.signal),
        modes: listModes(),
      }
    }
    case 'select':
      return { selection: store.select(args) }
    case 'writable':
      return { writable: store.setWritable(args.writable === true), configWritable: store.configWritable }
    case 'pulse':
      return { rev: store.refreshRev(), selection: store.selection, writable: store.writable }
    default:
      throw new QibiError('UNKNOWN_ENDPOINT', `未知的 qibi 接口：${String(endpoint)}`)
  }
}

/** 统一的 JSON 响应。 */
function reply(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

/** 解析面板内 AI 用的模型：config 覆盖优先，否则 DSH 当前默认模型。 */
function resolveSelection(ctx, config) {
  const provider = typeof config.aiProvider === 'string' && config.aiProvider.trim() ? config.aiProvider.trim() : null
  const model = typeof config.aiModel === 'string' && config.aiModel.trim() ? config.aiModel.trim() : null
  if (provider && model) {
    return { provider, model, reasoningEffort: typeof config.aiReasoningEffort === 'string' ? config.aiReasoningEffort : undefined }
  }
  const defaults = getService(ctx, 'agentDefaultModel')
  if (defaults && typeof defaults.currentSelection === 'function') {
    try {
      const current = defaults.currentSelection()
      if (current?.provider && current?.model) return current
    } catch {
      // 默认模型服务还没就绪。
    }
  }
  return null
}

/** Shared per-call model and reasoning validation for prose and character suggestions. */
async function resolveWritingRuntime(ctx, config, input, signal) {
  const llm = getService(ctx, 'llm')
  let selection = resolveSelection(ctx, config ?? {})
  if (!llm || !selection) throw new QibiError('AI_UNAVAILABLE', 'DSH 里没有可用的模型，请先在模型选择器里选一个。')
  if (typeof input?.modelKey === 'string' && input.modelKey !== `${selection.provider}/${selection.model}`) {
    throw new QibiError('AI_MODEL_CHANGED', '生成模型已经改变，请重新打开 AI 面板后再选择思考强度。')
  }
  const effort = input?.reasoningEffort
  if (effort !== undefined && effort !== null && effort !== '') {
    if (typeof effort !== 'string') throw new QibiError('BAD_REASONING_EFFORT', '思考强度必须是模型支持的档位。')
    const reasoning = await getReasoningInfo(llm, selection, signal)
    if (!reasoning.known) throw new QibiError('REASONING_CAPABILITY_UNAVAILABLE', '暂时无法读取此模型的思考档位，请跟随当前设置或重新打开面板。')
    if (!reasoning.efforts.some(row => row.id === effort)) throw new QibiError('UNSUPPORTED_REASONING_EFFORT', '当前生成模型不支持这个思考档位，请重新选择。')
    selection = { ...selection, reasoningEffort: effort }
  }
  return { llm, selection }
}

/**
 * 激活插件。
 * @param {import('@deepseek-ai/cordis').Context} ctx 宿主上下文。
 * @param {Record<string, unknown>} config 插件 config。
 */
export async function activate(ctx, config) {
  const store = new QibiStore(config ?? {})
  const dataSettings = createDataSettings(ctx, config ?? {}, store)
  const characterAi = {
    async generate(input, signal) {
      const runtime = await resolveWritingRuntime(ctx, config, input, signal)
      try { return await generateCharacterCandidates({ store, input, ...runtime, signal }) }
      catch (error) { throw new QibiError(error.code ?? 'CHARACTER_AI_FAILED', error.message) }
    },
  }
  const continuityOrganizer = createContinuityOrganizer({
    store,
    resolveRuntime: (input, signal) => resolveWritingRuntime(ctx, config, input, signal),
    ErrorType: QibiError,
  })
  const env = { ctx, config: config ?? {}, dataSettings, characterAi, continuityOrganizer }

  ctx.effect(() => () => { continuityOrganizer.dispose(); store.dispose() }, 'qibi: database and continuity tasks')

  // 共享 /api 通道上的精确路由：Connection 负责物理载体、浏览器 cookie 鉴权与请求体读取，
  // 只有 owner Peer 能到达到这里。
  ctx.effect(() => {
    const dispose = ctx.connection.fetch.register({
      path: ROUTE_PATH,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async request => {
        let body
        try {
          body = await request.json()
        } catch {
          return reply({ ok: false, error: { code: 'BAD_REQUEST', message: 'body 不是 JSON', details: {} } }, 400)
        }
        const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : ''
        if (!endpoint) {
          return reply({ ok: false, error: { code: 'BAD_REQUEST', message: '缺少 endpoint', details: {} } }, 400)
        }
        try {
          return reply({ ok: true, value: await dispatch(store, endpoint, body?.payload, { ...env, signal: request.signal }) })
        } catch (error) {
          return reply({ ok: false, error: toPublicError(error) })
        }
      },
    })
    return () => { void dispose() }
  }, 'qibi: /api/qibi route')

  // 面板内 AI：走 DSH 自己的 llm 服务，响应是 SSE 流（逐 token 回传）。
  ctx.effect(() => {
    const dispose = ctx.connection.fetch.register({
      path: AI_ROUTE_PATH,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async request => {
        let body
        try {
          body = await request.json()
        } catch {
          return reply({ ok: false, error: { code: 'BAD_REQUEST', message: 'body 不是 JSON', details: {} } }, 400)
        }
        const mode = typeof body?.mode === 'string' ? body.mode : ''
        let runtime
        let prompts
        try {
          runtime = await resolveWritingRuntime(ctx, config, body, request.signal)
          const novelId = Number(body?.novelId)
          if (!Number.isFinite(novelId) || novelId <= 0) throw new Error('缺少 novelId')
          const chapterId = body?.chapterId == null ? null : Number(body.chapterId)
          const context = buildContext(store, { novelId, chapterId })
          prompts = buildPrompts({
            mode,
            context,
            content: typeof body?.content === 'string' ? body.content : '',
            extra: typeof body?.extra === 'string' ? body.extra : '',
          })
        } catch (error) {
          return reply({ ok: false, error: toPublicError(error) }, error.code === 'AI_UNAVAILABLE' ? 503 : 400)
        }
        const { selection, llm } = runtime

        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder()
            const send = payload => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
            let full = ''
            try {
              for await (const delta of streamText({
                selection,
                llm,
                system: prompts.system,
                prompt: prompts.prompt,
                maxTokens: prompts.maxTokens,
                signal: request.signal,
              })) {
                full += delta
                send({ type: 'delta', text: delta })
              }
              send({ type: 'done', text: full, rewrite: prompts.rewrite === true, report: prompts.report === true })
            } catch (error) {
              if (error?.code === 'MAX_TOKENS') {
                // 截断仍保留已生成内容，但明确标记不完整，面板会禁用写回并提供「继续生成」。
                send({ type: 'done', text: full, rewrite: prompts.rewrite === true, report: prompts.report === true, truncated: true })
              } else {
                send({ type: 'error', message: error instanceof Error ? error.message : String(error) })
              }
            } finally {
              controller.close()
            }
          },
        })
        return new Response(stream, {
          status: 200,
          headers: {
            'content-type': 'text/event-stream; charset=utf-8',
            'cache-control': 'no-store',
            connection: 'keep-alive',
          },
        })
      },
    })
    return () => { void dispose() }
  }, 'qibi: /api/qibi/ai route')

  registerTools(ctx, store, dataSettings, characterAi)

  // 让 Agent 知道面板此刻指着哪一章，省掉一句「你要我改哪章」。
  ctx.effect(() => ctx.systemPrompt.section({
    name: 'qibi-selection',
    order: 60,
    text: () => store.selectionLine(),
  }), 'qibi: selection context')

  // 当前作品启用的蒸馏作者 Skill：生成/润色时自动遵循。
  ctx.effect(() => ctx.systemPrompt.section({
    name: 'qibi-distill-style',
    order: 61,
    text: () => store.distilledStyleLine(),
  }), 'qibi: distilled author style')
}
