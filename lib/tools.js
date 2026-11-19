/**
 * 面向 Agent 的 `qibi_* 工具。
 *
 * 设计取舍（对着"功能对齐、UI 不搬"的定位）：
 * - 按**领域**给工具，而不是按接口给：`qibi_novel` / `qibi_chapter` / `qibi_outline` /
 *   `qibi_character` / `qibi_continuity` 用 `action` 区分动作，模型一次学会一个域；
 * - 参数与输出都用真实 JSON Schema（DSH 的 enforced subset：properties/required/additionalProperties/items/enum）；
 * - 写入一律经过 store 的乐观锁与写前备份；`allowWrite:false` 时返回可读的拒绝原因；
 * - 不移植的能力（公共书城、管理员、MCP 客户端管理、起笔自己的模型调用层、地图可视化、作者蒸馏 SSE）不在这里开口子。
 */

import { truncate } from './text.js'
import { QibiError } from './store.js'

/** 统一的可读失败：让模型看到稳定错误码与原因，而不是堆栈。 */
function fail(error) {
  if (error instanceof QibiError) throw new Error(`${error.code}: ${error.message}`)
  throw new Error(error instanceof Error ? error.message : String(error))
}

/** 读取字符串参数。 */
function strArg(value, name, fallback) {
  if (typeof value === 'string') return value
  if (value === undefined || value === null) {
    if (fallback !== undefined) return fallback
    throw new Error(`缺少参数 ${name}`)
  }
  throw new Error(`参数 ${name} 必须是字符串`)
}

/** 读取整数参数。 */
function intArg(value, name, fallback) {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) return fallback
    throw new Error(`缺少参数 ${name}`)
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || Math.trunc(parsed) !== parsed) throw new Error(`参数 ${name} 必须是整数`)
  return parsed
}

/** 面板当前选中的章节。 */
function selectedChapterId(store) {
  return store.selection?.chapterId ?? null
}

/** 解析要操作的章节：显式参数 > 面板选中。 */
function resolveChapterId(store, args) {
  const explicit = args?.chapterId === undefined || args?.chapterId === null ? null : intArg(args.chapterId, 'chapterId')
  const chapterId = explicit ?? selectedChapterId(store)
  if (chapterId === null) {
    throw new Error('没有指定 chapterId，而且 DSH 面板里没有选中任何章节；先调用 qibi_chapter(action=list) 或在面板里选一章。')
  }
  return chapterId
}

/** 解析要操作的作品：显式参数 > 面板选中 > 唯一作品。 */
function resolveNovelId(store, args) {
  const explicit = args?.novelId === undefined || args?.novelId === null ? null : intArg(args.novelId, 'novelId')
  if (explicit !== null) return explicit
  const fromSelection = store.selection?.novelId ?? null
  if (fromSelection !== null) return fromSelection
  const novels = store.novels()
  if (novels.length === 1) return novels[0].id
  if (novels.length === 0) throw new Error('起笔里还没有任何作品，先用 qibi_novel(action=create) 新建一部。')
  throw new Error(`有多部作品，需要明确 novelId：${novels.map(n => `${n.id}=《${n.title}》`).join('、')}`)
}

/** 动作枚举。`required` 属于对象层，这里只能是属性 schema —— 之前多写了一个
 *  `required: true`，OpenAI 兼容端点会报 `true is not of type "array"`。 */
function actionSchema(actions, description) {
  return { type: 'string', enum: actions, description }
}

const OBJECT_OUTPUT = { type: 'object' }

/**
 * 注册全部工具。
 * @param {import('@deepseek-ai/cordis').Context} ctx 宿主插件上下文。
 * @param {import('./store.js').QibiStore} store 数据层。
 */
export function registerTools(ctx, store) {
  const tools = []

  // ---- 状态 ----
  tools.push({
    name: 'qibi_status',
    description: '起笔的连接状态：数据目录、当前作者、作品/章节/字数统计、写入是否开启，以及 DSH 面板里当前选中的作品与章节。',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    output: {
      schema: OBJECT_OUTPUT,
      render: (_args, value) => [{
        type: 'text',
        text: [
          `数据目录：${value.dataDir}`,
          `当前作者：${value.user ? value.user.username : '（无）'}`,
          `作品 ${value.counts.novels} 部 · 章节 ${value.counts.chapters} 章 · 共 ${value.counts.words} 字`,
          `写入：${value.writable ? '已开启' : value.configWritable ? '面板里已关闭' : '被 config.allowWrite 关闭（只读）'}`,
          `面板选中：${value.selection.chapterId === null ? '未选章节' : `作品 ${value.selection.novelId} · 章节 ${value.selection.chapterId}`}`,
        ].join('\n'),
      }],
    },
    execute: () => ({ ...store.status(), selection: { ...store.selection } }),
  })

  // ---- 作品 ----
  tools.push({
    name: 'qibi_novel',
    description: '起笔作品的增删改查。action=list 列出全部作品；create 新建；update 改标题/题材/状态/简介；delete 需 confirm: true（会连带删除全部章节与设定）。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['action'],
      properties: {
        action: actionSchema(['list', 'get', 'create', 'update', 'delete'], 'list 列表 | get 详情 | create 新建 | update 修改 | delete 删除'),
        novelId: { type: 'integer', description: '作品 id（get/update/delete 必填；省略时用面板选中）。' },
        title: { type: 'string', description: '作品名（create 必填）。' },
        author: { type: 'string', description: '作者署名。' },
        genre: { type: 'string', description: '题材，例如 玄幻 / 都市 / 悬疑。' },
        status: { type: 'string', description: '连载状态，例如 连载中 / 已完本。' },
        intro: { type: 'string', description: '简介。' },
        confirm: { type: 'boolean', description: '删除时必须是 true。' },
      },
    },
    output: {
      schema: OBJECT_OUTPUT,
      render: (_args, value) => [{
        type: 'text',
        text: value.novels
          ? value.novels.map(n => `${n.id}\t《${n.title}》\t${n.genre} · ${n.status} · ${n.chapterCount} 章 · ${n.wordCount} 字`).join('\n') || '起笔里还没有作品。'
          : value.deleted
            ? `已删除作品 ${value.deleted}。`
            : value.novel
              ? `《${value.novel.title}》· ${value.novel.genre} · ${value.novel.status} · ${value.novel.chapterCount} 章 · ${value.novel.wordCount} 字`
              : '完成。',
      }],
    },
    execute: args => {
      try {
        switch (args?.action) {
          case 'list': return { novels: store.novels() }
          case 'get': {
            const novelId = resolveNovelId(store, args)
            const novel = store.novels().find(row => row.id === novelId)
            if (!novel) throw new Error(`作品不存在：${novelId}`)
            return { novel }
          }
          case 'create': return store.createNovel(args)
          case 'update': return store.updateNovel({ ...args, novelId: resolveNovelId(store, args) })
          case 'delete': return store.deleteNovel({ ...args, novelId: resolveNovelId(store, args) })
          default: throw new Error(`未知 action：${String(args?.action)}`)
        }
      } catch (error) {
        return fail(error)
      }
    },
  })

  // ---- 章节 ----
  tools.push({
    name: 'qibi_chapter',
    description: '起笔章节的读写与增删。list 列章节（不含正文）；read 读正文并返回 token；write 整章覆盖（带 token 时若已被改动会拒绝，写前自动备份）；create 末尾新建；update 改标题/状态；delete 需 confirm；move 上移/下移。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['action'],
      properties: {
        action: actionSchema(['list', 'read', 'write', 'create', 'update', 'delete', 'move'], 'list | read | write | create | update | delete | move'),
        novelId: { type: 'integer', description: '作品 id（list/create 用；省略时用面板选中）。' },
        chapterId: { type: 'integer', description: '章节 id（read/write/update/delete/move 用；省略时用面板选中的章节）。' },
        title: { type: 'string', description: '章节标题（create 必填；update 可改）。' },
        status: { type: 'string', description: '章节状态，例如 草稿 / 已发布。' },
        content: { type: 'string', description: 'write 时的完整正文（不是增量）。' },
        expectedToken: { type: 'string', description: 'read 返回的 token。已有正文的章节必须提供：若这一章已被改动，写入会被拒绝而不是覆盖。' },
        allowTruncate: { type: 'boolean', description: '仅当确实要把正文改短到现有正文的开头部分时传 true；默认拒绝这种疑似截断写回。' },
        allowEmpty: { type: 'boolean', description: '仅当确实要清空已有正文时传 true；默认拒绝空内容覆盖。' },
        direction: { type: 'string', enum: ['up', 'down'], description: 'move 的方向。' },
        maxChars: { type: 'integer', description: 'read 时正文最多返回多少字符，默认 8000。' },
        confirm: { type: 'boolean', description: 'delete 时必须是 true。' },
      },
    },
    output: {
      schema: OBJECT_OUTPUT,
      render: (_args, value) => {
        if (value.chapters) {
          return [{
            type: 'text',
            text: value.chapters.length === 0
              ? '这部作品还没有章节。'
              : `作品 ${value.novelId} 共 ${value.chapters.length} 章：\n${value.chapters.map(c => `${c.id}\t${c.title}\t${c.status}\t${c.wordCount} 字`).join('\n')}`,
          }]
        }
        if (value.chapter && value.truncated !== undefined) {
          const body = value.content.trim() ? value.content : '（本章还没有正文）'
          const tokenLine = value.token
            ? `token ${value.token}`
            : '未返回 token：正文已被截断，禁止用这次读取的内容写回整章'
          return [{
            type: 'text',
            text: `第 ${value.id} 章《${value.title}》· ${value.status} · ${value.wordCount} 字 · ${tokenLine}\n\n${body}${value.truncated ? `\n\n[正文已截断：共 ${value.wordCount} 字。请提高 maxChars 重新完整读取后再写回]` : ''}`,
          }]
        }
        if (value.chapter) {
          return [{ type: 'text', text: `第 ${value.chapter.id} 章《${value.chapter.title}》：${value.chapter.wordCount} 字${value.revisionId ? `，旧稿已备份为版本 #${value.revisionId}` : ''}。` }]
        }
        if (value.deleted) {
          const backup = value.backupPath ? `（正文已备份到 ${value.backupPath}）` : '（本章没有正文）'
          return [{ type: 'text', text: `已删除章节 ${value.deleted}${backup}。` }]
        }
        if (value.moved !== undefined) return [{ type: 'text', text: value.moved ? `已调整顺序，新顺序：${value.order.join(' → ')}` : '已经在边界上，顺序未变。' }]
        return [{ type: 'text', text: '完成。' }]
      },
    },
    execute: args => {
      try {
        switch (args?.action) {
          case 'list': {
            const novelId = resolveNovelId(store, args)
            return { novelId, chapters: store.chapters(novelId) }
          }
          case 'read': {
            const chapterId = resolveChapterId(store, args)
            const chapter = store.chapter(chapterId)
            const cut = truncate(chapter.content, intArg(args?.maxChars, 'maxChars', 8000))
            return {
              ...chapter,
              content: cut.text,
              truncated: cut.truncated,
              // 截断的正文不能代表整章，交出去的 token 会诱导模型用半章覆盖整章。
              token: cut.truncated ? null : chapter.token,
              chapter: true,
            }
          }
          case 'write': {
            const chapterId = resolveChapterId(store, args)
            if (!store.writable) {
              throw new QibiError(
                store.configWritable ? 'WRITE_DISABLED' : 'READ_ONLY',
                store.configWritable
                  ? '面板里的写入开关是关闭的，不能保存正文。'
                  : '插件当前是只读模式，不能保存正文。把插件 config 的 allowWrite 设为 true 后重启 DSH 即可。',
              )
            }
            const content = strArg(args?.content, 'content')
            const expectedToken = typeof args?.expectedToken === 'string' && args.expectedToken !== ''
              ? args.expectedToken
              : undefined
            const current = store.chapter(chapterId)
            const existing = String(current.content ?? '')
            if (existing.trim() && !content.trim() && args?.allowEmpty !== true) {
              throw new QibiError('EMPTY_WRITE', '拒绝用空内容覆盖已有正文；确实要清空请传 allowEmpty: true。', { chapterId })
            }
            if (existing.trim() && expectedToken === undefined) {
              throw new QibiError('TOKEN_REQUIRED', '这一章已有正文：先 qibi_chapter(action=read) 拿到 token，再带着 expectedToken 写回。', { chapterId })
            }
            if (
              existing.trim()
              && content.length < existing.length
              && existing.startsWith(content)
              && args?.allowTruncate !== true
            ) {
              throw new QibiError('TRUNCATED_WRITE', '新正文正好是现有正文的开头部分，疑似截断写回。请完整读取后再写；确实要截断请传 allowTruncate: true。', {
                chapterId,
                currentLength: existing.length,
                nextLength: content.length,
              })
            }
            return store.saveChapter({ chapterId, content, expectedToken })
          }
          case 'create': {
            const novelId = resolveNovelId(store, args)
            const created = store.createChapter({ novelId, title: strArg(args?.title, 'title') })
            if (typeof args?.content === 'string' && args.content.trim()) {
              return store.saveChapter({ chapterId: created.chapter.id, content: args.content })
            }
            return created
          }
          case 'update': return store.updateChapter({ chapterId: resolveChapterId(store, args), title: args?.title, status: args?.status })
          case 'delete': return store.deleteChapter({ chapterId: resolveChapterId(store, args), confirm: args?.confirm === true })
          case 'move': return store.moveChapter({ chapterId: resolveChapterId(store, args), direction: args?.direction })
          default: throw new Error(`未知 action：${String(args?.action)}`)
        }
      } catch (error) {
        return fail(error)
      }
    },
  })

  // ---- 版本历史 ----
  tools.push({
    name: 'qibi_revision',
    description: '起笔的章节版本历史。list 列出版本（含「DSH 写入前备份」等来源）；restore 恢复某个版本（当前正文会先被备份）。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['action'],
      properties: {
        action: actionSchema(['list', 'restore'], 'list | restore'),
        chapterId: { type: 'integer', description: '章节 id；省略时用面板选中的章节。' },
        revisionId: { type: 'integer', description: 'restore 时要恢复的版本 id。' },
      },
    },
    output: {
      schema: OBJECT_OUTPUT,
      render: (_args, value) => [{
        type: 'text',
        text: value.revisions
          ? (value.revisions.length === 0 ? '这一章还没有历史版本。' : value.revisions.map(r => `#${r.id}\t${r.createdAt}\t${r.reason}\t${r.wordCount} 字`).join('\n'))
          : `已恢复到版本，当前 ${value.chapter.wordCount} 字。`,
      }],
    },
    execute: args => {
      try {
        const chapterId = resolveChapterId(store, args)
        if (args?.action === 'list') return { revisions: store.revisions(chapterId) }
        if (args?.action === 'restore') return store.restoreRevision({ chapterId, revisionId: intArg(args?.revisionId, 'revisionId') })
        throw new Error(`未知 action：${String(args?.action)}`)
      } catch (error) {
        return fail(error)
      }
    },
  })

  // ---- 大纲 ----
  tools.push({
    name: 'qibi_outline',
    description: '起笔的大纲条目（总纲 + 章节细纲）。list 列出；create 新建；update 改标题/正文/归属章节；delete 删除。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['action'],
      properties: {
        action: actionSchema(['list', 'create', 'update', 'delete'], 'list | create | update | delete'),
        novelId: { type: 'integer', description: '作品 id；省略时用面板选中。' },
        outlineId: { type: 'integer', description: '大纲条目 id（update/delete 必填）。' },
        chapterId: { type: 'integer', description: '归属章节 id；省略表示总纲。' },
        title: { type: 'string', description: '条目标题。' },
        content: { type: 'string', description: '条目正文。' },
        expectedToken: { type: 'string', description: 'update 时建议带上 list 返回的 token：条目若已被其他窗口或 Agent 修改，写入会被拒绝。' },
      },
    },
    output: {
      schema: OBJECT_OUTPUT,
      render: (_args, value) => {
        if (value.outline) {
          return [{
            type: 'text',
            text: value.outline.length === 0
              ? '这部作品还没有大纲。'
              : value.outline.map(o => `#${o.id}\t${o.chapterId === null ? '总纲' : `第 ${o.chapterId} 章`}\t${o.title}\n${o.content}`).join('\n---\n'),
          }]
        }
        return [{ type: 'text', text: value.deleted ? `已删除大纲 ${value.deleted}。` : '完成。' }]
      },
    },
    execute: args => {
      try {
        switch (args?.action) {
          case 'list': return { outline: store.outline(resolveNovelId(store, args)) }
          case 'create': return store.createOutline({ ...args, novelId: resolveNovelId(store, args) })
          case 'update': return store.updateOutline(args)
          case 'delete': return store.deleteOutline(args)
          default: throw new Error(`未知 action：${String(args?.action)}`)
        }
      } catch (error) {
        return fail(error)
      }
    },
  })

  // ---- 人物 ----
  tools.push({
    name: 'qibi_character',
    description: '起笔的人物设定与动态账本。list 列出（含位置/境界）；create/update/delete 维护设定；state 读动态账本；set_state 写位置/境界/道具/近期事件等。写新章前用它保持一致性。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['action'],
      properties: {
        action: actionSchema(['list', 'create', 'update', 'delete', 'state', 'set_state'], 'list | create | update | delete | state | set_state'),
        novelId: { type: 'integer', description: '作品 id；省略时用面板选中。' },
        characterId: { type: 'integer', description: '人物 id（update/delete/state/set_state 必填）。' },
        name: { type: 'string', description: '姓名（create 必填）。' },
        alias: { type: 'string', description: '别名/称号。' },
        role: { type: 'string', description: '定位，例如 主角 / 配角 / 反派。' },
        gender: { type: 'string', description: '性别。' },
        age: { type: 'string', description: '年龄。' },
        appearance: { type: 'string', description: '外貌。' },
        personality: { type: 'string', description: '性格。' },
        background: { type: 'string', description: '背景。' },
        location: { type: 'string', description: 'set_state：当前位置。' },
        realm: { type: 'string', description: 'set_state：境界/等级。' },
        inventory: { type: 'string', description: 'set_state：持有道具。' },
        statusEffects: { type: 'string', description: 'set_state：伤病/状态。' },
        recentEvents: { type: 'string', description: 'set_state：近期事件。' },
        keyRelationships: { type: 'string', description: 'set_state：关键关系。' },
        notes: { type: 'string', description: 'set_state：备注。' },
        expectedToken: { type: 'string', description: 'update/set_state 时建议带上读取返回的 token：条目若已被其他窗口或 Agent 修改，写入会被拒绝。' },
      },
    },
    output: {
      schema: OBJECT_OUTPUT,
      render: (_args, value) => {
        if (value.characters) {
          return [{
            type: 'text',
            text: value.characters.length === 0
              ? '这部作品还没有人物设定。'
              : value.characters.map(c => {
                const bits = [c.role, c.gender, c.alias ? `别名 ${c.alias}` : ''].filter(Boolean).join(' · ')
                const state = [c.location, c.realm].filter(Boolean).join(' · ')
                return `${c.id}\t${c.name}${bits ? `（${bits}）` : ''}${c.personality ? `：${c.personality}` : ''}${state ? `［${state}］` : ''}`
              }).join('\n'),
          }]
        }
        if (value.state) {
          return [{
            type: 'text',
            text: value.state.exists === false
              ? '这个人物还没有动态账本。'
              : `人物 ${value.state.characterId}：位置 ${value.state.location || '—'} · 境界 ${value.state.realm || '—'} · 道具 ${value.state.inventory || '—'} · 状态 ${value.state.statusEffects || '—'} · 近期 ${value.state.recentEvents || '—'}`,
          }]
        }
        return [{ type: 'text', text: value.deleted ? `已删除人物 ${value.deleted}。` : '完成。' }]
      },
    },
    execute: args => {
      try {
        switch (args?.action) {
          case 'list': return { characters: store.characters(resolveNovelId(store, args)) }
          case 'create': return store.createCharacter({ ...args, novelId: resolveNovelId(store, args) })
          case 'update': return store.updateCharacter(args)
          case 'delete': return store.deleteCharacter(args)
          case 'state': return { state: store.characterState(intArg(args?.characterId, 'characterId')) }
          case 'set_state': return { state: store.updateCharacterState(args) }
          default: throw new Error(`未知 action：${String(args?.action)}`)
        }
      } catch (error) {
        return fail(error)
      }
    },
  })

  // ---- 连续性（分卷 / 章节摘要 / 写作状态） ----
  tools.push({
    name: 'qibi_continuity',
    description: '长篇连续性资料：分卷（volumes / create_volume / update_volume）、章节微摘要（summary / set_summary）、作品写作状态与伏笔账本（writer_state / set_writer_state）。写新章前先读这些，避免与既有设定冲突。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['action'],
      properties: {
        action: actionSchema(
          ['volumes', 'create_volume', 'update_volume', 'summary', 'set_summary', 'writer_state', 'set_writer_state'],
          '要读写的连续性资料',
        ),
        novelId: { type: 'integer', description: '作品 id；省略时用面板选中。' },
        chapterId: { type: 'integer', description: '章节 id（summary/set_summary；省略时用面板选中）。' },
        volumeId: { type: 'integer', description: '分卷 id（update_volume 必填）。' },
        title: { type: 'string', description: '分卷标题（create_volume 必填）。' },
        summary: { type: 'string', description: '分卷简介，或章节摘要（set_summary）。' },
        coreConflict: { type: 'string', description: '分卷核心冲突。' },
        keyEvents: { type: 'string', description: 'set_summary：关键事件。' },
        cliffhanger: { type: 'string', description: 'set_summary：章末钩子。' },
        progress: { type: 'string', description: 'set_writer_state：当前写作进度/下一步计划。' },
        foreshadowing: { type: 'string', description: 'set_writer_state：伏笔账本，JSON 字符串。' },
        expectedToken: { type: 'string', description: '写入分卷/摘要/写作状态时建议带上读取返回的 token：已被其他窗口或 Agent 修改时写入会被拒绝。' },
      },
    },
    output: {
      schema: OBJECT_OUTPUT,
      render: (_args, value) => {
        if (value.volumes) {
          return [{ type: 'text', text: value.volumes.length === 0 ? '这部作品还没有分卷。' : value.volumes.map(v => `#${v.id}\t${v.title}\t${v.summary}`).join('\n') }]
        }
        if (value.summary) {
          return [{
            type: 'text',
            text: value.summary.exists === false
              ? '这一章还没有摘要。'
              : `第 ${value.summary.chapterId} 章摘要：${value.summary.summary}\n关键事件：${value.summary.keyEvents || '—'}\n章末钩子：${value.summary.cliffhanger || '—'}`,
          }]
        }
        if (value.writerState) {
          return [{
            type: 'text',
            text: value.writerState.exists === false
              ? '这部作品还没有写作状态记录。'
              : `进度：${value.writerState.progress || '—'}\n伏笔账本：${value.writerState.foreshadowing}`,
          }]
        }
        return [{ type: 'text', text: '完成。' }]
      },
    },
    execute: args => {
      try {
        switch (args?.action) {
          case 'volumes': return { volumes: store.volumes(resolveNovelId(store, args)) }
          case 'create_volume': return { volumes: store.createVolume({ ...args, novelId: resolveNovelId(store, args) }).volumes }
          case 'update_volume': return { volumes: store.updateVolume(args).volumes }
          case 'summary': return { summary: store.chapterSummary(resolveChapterId(store, args)) }
          case 'set_summary': return { summary: store.upsertChapterSummary({ ...args, chapterId: resolveChapterId(store, args) }) }
          case 'writer_state': return { writerState: store.writerState(resolveNovelId(store, args)) }
          case 'set_writer_state': return { writerState: store.updateWriterState({ ...args, novelId: resolveNovelId(store, args) }) }
          default: throw new Error(`未知 action：${String(args?.action)}`)
        }
      } catch (error) {
        return fail(error)
      }
    },
  })

  // ---- 检索 ----
  tools.push({
    name: 'qibi_kb',
    description: '起笔自带的分层记忆检索（BM25 over kb_chunks，与起笔内部检索同一套分词与打分）。query 查最相关片段；stats 看索引规模；reindex 整本重建索引。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['action'],
      properties: {
        action: actionSchema(['query', 'stats', 'reindex'], 'query | stats | reindex'),
        novelId: { type: 'integer', description: '作品 id；省略时用面板选中。' },
        query: { type: 'string', description: 'query 时的检索词或句子。' },
        limit: { type: 'integer', description: 'query 返回条数，默认 5，最多 20。' },
      },
    },
    output: {
      schema: OBJECT_OUTPUT,
      render: (_args, value) => {
        if (value.hits) {
          return [{
            type: 'text',
            text: value.hits.length === 0
              ? '没有检索到相关片段。'
              : value.hits.map(hit => `[${hit.score}] ${hit.kind}${hit.sourceId === null ? '' : `#${hit.sourceId}`} ${hit.title}\n${hit.content.slice(0, 200)}`).join('\n---\n'),
          }]
        }
        return [{ type: 'text', text: `知识库：${value.stats.chunks} 个片段${value.stats.lastIndexed ? `，最后索引于 ${value.stats.lastIndexed}` : ''}。` }]
      },
    },
    execute: args => {
      try {
        const novelId = resolveNovelId(store, args)
        switch (args?.action) {
          case 'query': return { hits: store.kbQuery(novelId, strArg(args?.query, 'query'), intArg(args?.limit, 'limit', 5)) }
          case 'stats': return { stats: store.kbStats(novelId) }
          case 'reindex': return { stats: store.reindexNovel(novelId) }
          default: throw new Error(`未知 action：${String(args?.action)}`)
        }
      } catch (error) {
        return fail(error)
      }
    },
  })

  // ---- 关键词检索 ----
  tools.push({
    name: 'qibi_search',
    description: '在起笔书稿里做关键词检索（章节标题/正文 + 人物），返回有界命中与片段。想按「意思」找片段时用 qibi_kb(query)。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['query'],
      properties: {
        query: { type: 'string', description: '关键词或人名。' },
        novelId: { type: 'integer', description: '可选：限定在某部作品内。' },
      },
    },
    output: {
      schema: OBJECT_OUTPUT,
      render: (_args, value) => {
        const lines = []
        if (value.chapters.length > 0) {
          lines.push(`章节命中 ${value.chapters.length} 条：`)
          for (const hit of value.chapters) lines.push(`- 第 ${hit.id} 章《${hit.title}》(${hit.wordCount} 字)：${hit.snippet}`)
        }
        if (value.characters.length > 0) {
          lines.push(`人物命中 ${value.characters.length} 条：`)
          for (const hit of value.characters) lines.push(`- ${hit.name}（${hit.role}）${hit.background.slice(0, 80)}`)
        }
        return [{ type: 'text', text: lines.length === 0 ? '没有命中。' : lines.join('\n') }]
      },
    },
    execute: args => {
      const query = strArg(args?.query, 'query').trim()
      if (!query) throw new Error('query 不能为空')
      return store.search(query, args?.novelId == null ? null : intArg(args.novelId, 'novelId'))
    },
  })

  // ---- 导出 ----
  tools.push({
    name: 'qibi_export',
    description: '把整本导出为 Markdown 或 TXT 文本。返回文本内容与建议文件名，落盘请用 DSH 的写文件工具（插件不擅自决定路径）。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        novelId: { type: 'integer', description: '作品 id；省略时用面板选中。' },
        format: { type: 'string', enum: ['markdown', 'txt'], description: '导出格式，默认 markdown。' },
        onlyPublished: { type: 'boolean', description: '只导出状态为「已发布」的章节。' },
      },
    },
    output: {
      schema: OBJECT_OUTPUT,
      render: (_args, value) => [{
        type: 'text',
        text: `《${value.title}》导出为 ${value.format}：${value.chapters} 章 · ${value.wordCount} 字，建议文件名 ${value.filename}。`,
      }],
    },
    execute: args => store.exportNovel({
      novelId: resolveNovelId(store, args),
      format: args?.format === 'txt' ? 'txt' : 'markdown',
      onlyPublished: args?.onlyPublished === true,
    }),
  })

  // ---- 蒸馏作者 ----
  tools.push({
    name: 'qibi_distill',
    description: '起笔蒸馏作者。authors 列出作者；author 查看素材与版本；read 汇总全部素材样本、上一版本和三段提示词（生成前先调用）；save 保存 writingSkill/authorPersona/skillMarkdown 为新版本；bind 绑定到作品；unbind 解除作品绑定；versions/rollback 管理版本；create 新建；add_text 追加粘贴素材。',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['action'],
      properties: {
        action: actionSchema(
          ['authors', 'author', 'read', 'save', 'bind', 'unbind', 'versions', 'rollback', 'create', 'add_text'],
          'authors | author | read | save | bind | unbind | versions | rollback | create | add_text',
        ),
        authorId: { type: 'integer', description: '蒸馏作者 id。' },
        novelId: { type: 'integer', description: 'bind 时的作品 id；省略时用面板选中。' },
        name: { type: 'string', description: 'create 时的作者名称。' },
        profile: { type: 'string', description: 'create/author 的作者画像 JSON 字符串。' },
        versionId: { type: 'integer', description: 'rollback 时的版本 id。' },
        writingSkill: { type: 'string', description: 'save 时的 writing skill。' },
        authorPersona: { type: 'string', description: 'save 时的 author persona。' },
        skillMarkdown: { type: 'string', description: 'save 时合并后的最终 Skill Markdown。' },
        sampleSummary: { type: 'string', description: 'save 时的素材摘要。' },
        filename: { type: 'string', description: 'add_text 的素材文件名，默认 粘贴材料.txt。' },
        content: { type: 'string', description: 'add_text 的素材正文。' },
        kind: { type: 'string', enum: ['novel', 'comment', 'social'], description: '素材类型，默认 novel。' },
      },
    },
    output: {
      schema: OBJECT_OUTPUT,
      render: (_args, value) => {
        if (value.authors) {
          return [{
            type: 'text',
            text: value.authors.length === 0
              ? '还没有蒸馏作者。'
              : value.authors.map(author => `${author.id}\t《${author.name}》\t${author.status}\t${author.sourceCount} 份素材\t当前版本 v${author.currentVersion?.version ?? '—'}`).join('\n'),
          }]
        }
        if (value.material !== undefined) {
          return [{
            type: 'text',
            text: `《${value.author.name}》：${value.sources.length} 份素材，样本 ${value.material.length} 字符；上一版本 ${value.previous ? `v${value.previous.version}` : '无'}。三段提示词已随结果返回，生成后用 qibi_distill(action=save) 保存。`,
          }]
        }
        if (value.sources && value.versions) {
          return [{
            type: 'text',
            text: [
              `《${value.name}》· ${value.status} · 当前版本 v${value.currentVersion?.version ?? '—'}`,
              `素材 ${value.sources.length} 份：${value.sources.map(source => `${source.filename}（${source.status}）`).join('、') || '无'}`,
              `版本 ${value.versions.length} 个：${value.versions.map(version => `v${version.version}`).join('、') || '无'}`,
            ].join('\n'),
          }]
        }
        if (value.version) return [{ type: 'text', text: `已保存《${value.author.name}》v${value.version.version}。` }]
        if (value.writerState) return [{ type: 'text', text: value.writerState.distilledAuthorId ? `已绑定作者 ${value.writerState.distilledAuthorId}。` : '已解除蒸馏作者绑定。' }]
        if (value.filename) return [{ type: 'text', text: `已添加素材 ${value.filename}（${value.parsedChars} 字，${value.chapterCount} 章）。` }]
        if (value.versions) return [{ type: 'text', text: value.versions.length === 0 ? '还没有版本。' : value.versions.map(version => `v${version.version}\t${version.createdAt}\t${version.sampleSummary}`).join('\n') }]
        if (value.deleted) return [{ type: 'text', text: `已删除 ${value.deleted}。` }]
        if (value.id && value.name) return [{ type: 'text', text: `《${value.name}》· ${value.status} · 当前版本 v${value.currentVersion?.version ?? '—'}` }]
        return [{ type: 'text', text: '完成。' }]
      },
    },
    execute: async args => {
      try {
        switch (args?.action) {
          case 'authors':
            return { authors: store.distilledAuthors() }
          case 'author':
            return store.distilledAuthor(intArg(args?.authorId, 'authorId'))
          case 'read':
            return store.distilledMaterial(intArg(args?.authorId, 'authorId'))
          case 'save':
            return store.saveDistilledVersion({
              authorId: intArg(args?.authorId, 'authorId'),
              writingSkill: typeof args?.writingSkill === 'string' ? args.writingSkill : '',
              authorPersona: typeof args?.authorPersona === 'string' ? args.authorPersona : '',
              skillMarkdown: strArg(args?.skillMarkdown, 'skillMarkdown'),
              sampleSummary: typeof args?.sampleSummary === 'string' ? args.sampleSummary : '',
            })
          case 'bind':
            return store.bindDistilledAuthor({
              novelId: args?.novelId == null ? store.selection?.novelId : intArg(args.novelId, 'novelId'),
              authorId: args?.authorId == null ? null : intArg(args.authorId, 'authorId'),
            })
          case 'unbind':
            return store.bindDistilledAuthor({
              novelId: args?.novelId == null ? store.selection?.novelId : intArg(args.novelId, 'novelId'),
              authorId: null,
            })
          case 'versions':
            return { versions: store.distilledVersions(intArg(args?.authorId, 'authorId')) }
          case 'rollback':
            return store.rollbackDistilledVersion({
              authorId: intArg(args?.authorId, 'authorId'),
              versionId: intArg(args?.versionId, 'versionId'),
            })
          case 'create':
            return store.createDistilledAuthor({ name: strArg(args?.name, 'name'), profile: args?.profile })
          case 'add_text':
            return store.addDistilledText({
              authorId: intArg(args?.authorId, 'authorId'),
              filename: typeof args?.filename === 'string' ? args.filename : undefined,
              kind: typeof args?.kind === 'string' ? args.kind : undefined,
              text: strArg(args?.content, 'content'),
            })
          default:
            throw new Error(`未知 action：${String(args?.action)}`)
        }
      } catch (error) {
        return fail(error)
      }
    },
  })

  for (const tool of tools) {
    ctx.tools.register(tool)
  }
}
