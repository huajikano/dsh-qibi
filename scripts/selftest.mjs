/**
 * 开发自检：不起 DSH，直接跑 Host 半边。
 *
 * 覆盖面：
 * 1) 只读端点与工具契约（状态/作品/章节/大纲/人物/连续性/检索/导出）
 * 2) 只读模式拒写
 * 3) 写入路径（**只写临时副本**，脚本先断言目录再动手）：
 *    正文保存的四处不变量、令牌乐观锁、新建/改名/移动/删除、版本备份与恢复、
 *    人物动态账本、章节摘要、写作状态、知识库重建与 BM25 检索、导出文本
 * 4) 系统提示里的选中章节
 * 5) 真实库未被写入的回归断言
 *
 * 用法：node scripts/selftest.mjs
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { apply, inject as declaredInject } from '../index.js'
import { defaultDataDir } from '../lib/store.js'

const failures = []
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ok   ${label}`)
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`)
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

/**
 * 最小宿主上下文：
 * - config 在激活之前给定（store 在激活时按 config 解析数据目录）；
 * - 只暴露 `inject` 声明过的服务（Proxy 守卫），漏声明当场报错；
 * - 通道用 `connection.fetch.register`，并让 `connection.rpc.handle` 直接抛错
 *   （那条路在真宿主上会摸 connection 自己的 webServer 而失败）。
 */
async function harness(config = {}, extras = {}) {
  const tools = []
  const disposers = []
  const declared = new Set(declaredInject)
  const state = { route: null, routes: [], sections: [], config }
  const optional = { llm: extras.llm ?? null, agentDefaultModel: extras.agentDefaultModel ?? null }
  const services = {
    /** 宿主上的可选服务：插件用 ctx.get(name) 取。 */
    get(name) { return optional[name] ?? undefined },
    effect(fn) {
      const dispose = fn()
      if (typeof dispose === 'function') disposers.push(dispose)
      return dispose
    },
    tools: { register(definition) { tools.push(definition); return () => {} } },
    systemPrompt: { section(section) { state.sections.push(section); return () => {} } },
    connection: {
      fetch: {
        register(route) {
          state.route = route
          state.routes.push(route)
          return async () => {}
        },
      },
      rpc: {
        handle() {
          throw new Error('self-test: 不应该使用 connection.rpc.handle')
        },
      },
    },
  }
  const ctx = new Proxy(services, {
    get(target, key) {
      if (typeof key === 'symbol' || key in target) return target[key]
      if (!declared.has(key)) throw new Error(`cannot get property "${String(key)}" without inject`)
      return undefined
    },
  })
  await apply(ctx, config)
  return {
    ctx,
    tools,
    state,
    tool(name) {
      const found = tools.find(tool => tool.name === name)
      if (!found) throw new Error(`工具未注册：${name}`)
      return found
    },
    /** 像浏览器那样打一次端点。 */
    async call(endpoint, payload = {}) {
      const route = state.routes.find(row => row.path === '/api/qibi')
      if (!route) throw new Error('没有注册 /api/qibi 路由')
      const request = new Request('http://localhost/api/qibi', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint, payload }),
      })
      return (await route.fetch(request)).json()
    },
    async dispose() {
      for (const dispose of disposers.reverse()) {
        try {
          await dispose()
        } catch {
          // 自检里不追究卸载细节。
        }
      }
    },
  }
}

console.log('起笔数据目录：', defaultDataDir())
const realDb = path.join(defaultDataDir(), 'novelforge.db')
if (!fs.existsSync(realDb)) {
  console.error(`没有找到起笔数据库：${realDb}`)
  process.exit(2)
}

// ---- 1. 只读 ----
console.log('\n[1] 只读端点与工具')
const readOnly = await harness({ allowWrite: false, dataDir: defaultDataDir() })
check('注册了 /api/qibi 精确路由', readOnly.state.routes.some(route => route.path === '/api/qibi' && route.methods?.join(',') === 'POST'))
check('注册了 /api/qibi/ai 精确路由', readOnly.state.routes.some(route => route.path === '/api/qibi/ai'))

const status = await readOnly.call('status')
check('status 成功且有用户', status.ok === true && Boolean(status.value?.user?.username), JSON.stringify(status.error ?? ''))
check('只读模式 writable=false', status.value?.writable === false)

const novels = await readOnly.call('novels')
const novel = novels.value?.novels?.[0]
check('novels 返回列表', novels.ok === true && Array.isArray(novels.value?.novels))

const chapters = await readOnly.call('chapters', { novelId: novel.id })
const chapterMeta = chapters.value?.chapters?.[0]
check('chapters 返回列表', chapters.ok === true && Array.isArray(chapters.value?.chapters))

const chapter = await readOnly.call('chapter', { chapterId: chapterMeta.id })
check('chapter 返回正文与 token', chapter.ok === true && chapter.value.chapter.token?.length === 16)
check('chapter 字数与列表一致', chapter.value?.chapter?.wordCount === chapterMeta.wordCount)

// 归属边界：换一个用户 id，别人的作品/章节必须不可见、不可读。
const otherUser = status.value?.users?.find(user => user.id !== status.value.user?.id)
if (otherUser) {
  const foreign = await harness({ allowWrite: false, dataDir: defaultDataDir(), userId: otherUser.id })
  const foreignNovels = await foreign.call('novels')
  check('别人的作品不可见', foreignNovels.ok === true && foreignNovels.value?.novels?.length === 0)
  const foreignChapter = await foreign.call('chapter', { chapterId: chapterMeta.id })
  check('别人的章节不可读', foreignChapter.ok === false)
  const foreignSearch = await foreign.call('search', { query: '的' })
  check('别人的章节不进检索', foreignSearch.ok === true && foreignSearch.value?.chapters?.length === 0)
  await foreign.dispose()
} else {
  console.log('  skip 归属边界（库中只有一个用户）')
}

check('outline 可用', (await readOnly.call('outline', { novelId: novel.id })).ok === true)
check('characters 可用', (await readOnly.call('characters', { novelId: novel.id })).ok === true)
check('volumes 可用', (await readOnly.call('volumes', { novelId: novel.id })).ok === true)
check('chapterSummary 可用', (await readOnly.call('chapterSummary', { chapterId: chapterMeta.id })).ok === true)
check('writerState 可用', (await readOnly.call('writerState', { novelId: novel.id })).ok === true)
check('revisions 可用', (await readOnly.call('revisions', { chapterId: chapterMeta.id })).ok === true)
check('kbQuery 可用', (await readOnly.call('kbQuery', { novelId: novel.id, query: '的' })).ok === true)
check('kbStats 可用', (await readOnly.call('kbStats', { novelId: novel.id })).ok === true)
check('search 可用', (await readOnly.call('search', { novelId: novel.id, query: '的' })).ok === true)
check('export 可用', (await readOnly.call('export', { novelId: novel.id, format: 'markdown' })).ok === true)
check('pulse 可用', (await readOnly.call('pulse')).ok === true)

const toolNames = readOnly.tools.map(tool => tool.name).sort()
const expected = ['qibi_chapter', 'qibi_character', 'qibi_continuity', 'qibi_context', 'qibi_distill', 'qibi_export', 'qibi_kb', 'qibi_novel', 'qibi_outline', 'qibi_revision', 'qibi_search', 'qibi_status', 'qibi_storage']
check('注册了 13 个领域工具', JSON.stringify(toolNames) === JSON.stringify(expected), toolNames.join(','))

/**
 * 校验工具 schema 的 OpenAPI 子集形状。
 * 曾经因为把 `required: true` 写在属性层，OpenAI 兼容端点在发请求时直接 400：
 * `Invalid schema for function 'qibi_chapter': true is not of type "array"`。
 */
function schemaProblems(schema, path, problems) {
  const types = new Set(['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'])
  if (schema === null || typeof schema !== 'object') {
    problems.push(`${path} 不是对象`)
    return
  }
  if (Array.isArray(schema)) {
    schema.forEach((item, index) => schemaProblems(item, `${path}[${index}]`, problems))
    return
  }
  if ('type' in schema && !types.has(schema.type)) problems.push(`${path}.type=${JSON.stringify(schema.type)}`)
  if ('required' in schema && !Array.isArray(schema.required)) problems.push(`${path}.required 必须是数组`)
  if ('enum' in schema && !Array.isArray(schema.enum)) problems.push(`${path}.enum 必须是数组`)
  if ('properties' in schema) {
    if (schema.properties === null || typeof schema.properties !== 'object' || Array.isArray(schema.properties)) {
      problems.push(`${path}.properties 必须是对象`)
    } else {
      for (const [key, value] of Object.entries(schema.properties)) schemaProblems(value, `${path}.properties.${key}`, problems)
    }
  }
  if ('items' in schema) schemaProblems(schema.items, `${path}.items`, problems)
  if ('additionalProperties' in schema
    && typeof schema.additionalProperties !== 'boolean'
    && (schema.additionalProperties === null || typeof schema.additionalProperties !== 'object')) {
    problems.push(`${path}.additionalProperties 形状非法`)
  }
  if (Array.isArray(schema.required) && schema.properties && typeof schema.properties === 'object') {
    for (const key of schema.required) {
      if (!(key in schema.properties)) problems.push(`${path}.required 引用了不存在的属性 ${key}`)
    }
  }
}

for (const tool of readOnly.tools) {
  check(`  ${tool.name} 契约完整`, Boolean(tool.output?.schema) && typeof tool.output?.render === 'function' && tool.parameters?.type === 'object')
  const problems = []
  schemaProblems(tool.parameters, `${tool.name}.parameters`, problems)
  schemaProblems(tool.output?.schema, `${tool.name}.output`, problems)
  check(`  ${tool.name} schema 合法`, problems.length === 0, problems.join('；'))
}

// 工具实际执行
const statusTool = await readOnly.tool('qibi_status').execute({}, {})
check('qibi_status 返回统计', statusTool.counts.novels > 0 && statusTool.dataDir === defaultDataDir())
const novelList = await readOnly.tool('qibi_novel').execute({ action: 'list' }, {})
check('qibi_novel(list) 有作品', novelList.novels.length > 0)
const chapterList = await readOnly.tool('qibi_chapter').execute({ action: 'list', novelId: novel.id }, {})
check('qibi_chapter(list) 有章节', chapterList.chapters.length > 0)
const readResult = await readOnly.tool('qibi_chapter').execute({ action: 'read', chapterId: chapterMeta.id, maxChars: 100 }, {})
check('qibi_chapter(read) 截断时不发 token', readResult.truncated === true && readResult.token === null)
const kb = await readOnly.tool('qibi_kb').execute({ action: 'query', novelId: novel.id, query: '的' }, {})
check('qibi_kb(query) 有命中', Array.isArray(kb.hits))
const exported = await readOnly.tool('qibi_export').execute({ novelId: novel.id, format: 'markdown' }, {})
check('qibi_export 产出文本', exported.content.includes('# ') && exported.chapters > 0)
check('qibi_export 文件名安全', !/[\\/:*?"<>|]/.test(exported.filename))

let refused = null
try {
  await readOnly.tool('qibi_chapter').execute({ action: 'write', chapterId: chapterMeta.id, content: 'x' }, {})
} catch (error) {
  refused = error
}
check('只读模式拒写', refused !== null && /只读|allowWrite/i.test(refused.message), refused?.message)

// ---- 2. 写入（临时副本） ----
console.log('\n[2] 写入路径（临时副本）')
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'qibi-selftest-'))
if (!path.resolve(sandbox).startsWith(path.resolve(os.tmpdir()))) {
  console.error('拒绝继续：写入测试目录不在系统临时目录内')
  process.exit(3)
}
for (const suffix of ['', '-wal', '-shm']) {
  const source = `${realDb}${suffix}`
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(sandbox, `novelforge.db${suffix}`))
}

const writer = await harness({ allowWrite: true, dataDir: sandbox })
const wStatus = await writer.call('status')
check('写入测试用的是临时副本', wStatus.value?.dbPath === path.join(sandbox, 'novelforge.db'), String(wStatus.value?.dbPath))
if (wStatus.value?.dbPath !== path.join(sandbox, 'novelforge.db')) {
  console.error('拒绝继续：写入目标不是临时副本')
  process.exit(3)
}

const db = new DatabaseSync(path.join(sandbox, 'novelforge.db'), { readOnly: true })
const chapterTool = writer.tool('qibi_chapter')

if (otherUser) {
  const foreignWriter = await harness({ allowWrite: true, dataDir: sandbox, userId: otherUser.id })
  const blocked = await foreignWriter.call('save', { chapterId: chapterMeta.id, content: '不应写入的越权正文' })
  check('别人的章节不可写', blocked.ok === false)
  const untouched = db.prepare('SELECT content FROM chapters WHERE id = ?').get(chapterMeta.id)
  check('越权写入没有落库', !String(untouched?.content ?? '').includes('不应写入的越权正文'))
  await foreignWriter.dispose()
}

// 正文保存 + 不变量
const before = (await chapterTool.execute({ action: 'read', chapterId: chapterMeta.id }, {})).chapter ? await writer.call('chapter', { chapterId: chapterMeta.id }).then(r => r.value.chapter) : null
const nextContent = `${before.content}\n\n　　自检追加的一句正文。`
const saved = await chapterTool.execute({ action: 'write', chapterId: before.id, content: nextContent, expectedToken: before.token }, {})
check('写入成功并返回版本号', saved.chapter.wordCount !== before.wordCount && Number(saved.revisionId) > 0)
check('库里的正文已更新', db.prepare('SELECT content FROM chapters WHERE id = ?').get(before.id).content === nextContent)
check('库里有备份行', db.prepare('SELECT COUNT(*) AS c FROM chapter_revisions WHERE chapter_id = ?').get(before.id).c > 0)
const novelRow = db.prepare('SELECT word_count FROM novels WHERE id = ?').get(before.novelId)
const sum = db.prepare('SELECT COALESCE(SUM(word_count),0) AS wc FROM chapters WHERE novel_id = ?').get(before.novelId).wc
check('作品总字数已重算', Number(novelRow.word_count) === Number(sum))

// 强乐观锁
let conflict = null
try {
  await chapterTool.execute({ action: 'write', chapterId: before.id, content: '不应写入', expectedToken: before.token }, {})
} catch (error) {
  conflict = error
}
check('旧令牌被拒绝', conflict !== null && /改动|覆盖/.test(conflict.message), conflict?.message)
check('冲突时正文未被覆盖', db.prepare('SELECT content FROM chapters WHERE id = ?').get(before.id).content === nextContent)

// Agent 写安全：截断写回、空写、无 token
const currentAfter = await writer.call('chapter', { chapterId: before.id }).then(r => r.value.chapter)
let noToken = null
try {
  await chapterTool.execute({ action: 'write', chapterId: before.id, content: `${nextContent}\n多一句` }, {})
} catch (error) {
  noToken = error
}
check('已有正文的写入必须带 token', noToken !== null && /TOKEN_REQUIRED/.test(noToken.message), noToken?.message)
let emptyWrite = null
try {
  await chapterTool.execute({ action: 'write', chapterId: before.id, content: '', expectedToken: currentAfter.token }, {})
} catch (error) {
  emptyWrite = error
}
check('空内容覆盖被拒', emptyWrite !== null && /EMPTY_WRITE/.test(emptyWrite.message), emptyWrite?.message)
let truncatedWrite = null
try {
  await chapterTool.execute({ action: 'write', chapterId: before.id, content: nextContent.slice(0, 10), expectedToken: currentAfter.token }, {})
} catch (error) {
  truncatedWrite = error
}
check('前缀截断写回被拒', truncatedWrite !== null && /TRUNCATED_WRITE/.test(truncatedWrite.message), truncatedWrite?.message)
check('被拒的写入没有落库', db.prepare('SELECT content FROM chapters WHERE id = ?').get(before.id).content === nextContent)

// 版本历史
const revisions = await writer.tool('qibi_revision').execute({ action: 'list', chapterId: before.id }, {})
check('版本列表非空', revisions.revisions.length > 0)
const restored = await writer.tool('qibi_revision').execute({ action: 'restore', chapterId: before.id, revisionId: revisions.revisions[0].id }, {})
check('恢复历史版本成功', restored.chapter.wordCount > 0)
// 最新一条备份就是写入前的原文，恢复后应当与它一致。
check('恢复后与备份内容一致', db.prepare('SELECT content FROM chapters WHERE id = ?').get(before.id).content === before.content)

// AI 生成结果单独留档（不覆盖正文）
const aiRevision = await writer.call('addRevision', { chapterId: before.id, content: 'AI 生成的备选正文', reason: 'AI 生成 · 细纲写章' })
check('留存 AI 生成版本', aiRevision.ok === true && aiRevision.value?.revision?.id > 0, JSON.stringify(aiRevision.error ?? ''))
const revisionsAfterAi = await writer.tool('qibi_revision').execute({ action: 'list', chapterId: before.id }, {})
check('版本列表包含 AI 来源', revisionsAfterAi.revisions.some(row => String(row.reason).includes('AI 生成')))
check('留档不改变正文', db.prepare('SELECT content FROM chapters WHERE id = ?').get(before.id).content === before.content)

// 新建 / 改名 / 移动 / 删除
const created = await chapterTool.execute({ action: 'create', novelId: before.novelId, title: '自检新章' }, {})
check('新建章节', created.chapter.id > 0)
const renamed = await chapterTool.execute({ action: 'update', chapterId: created.chapter.id, status: '已发布' }, {})
check('改章节状态', renamed.chapter.status === '已发布')
const moved = await chapterTool.execute({ action: 'move', chapterId: created.chapter.id, direction: 'up' }, {})
check('移动章节', moved.moved === true)
const deleteContent = '删除前应被文件备份的正文'
await writer.call('save', { chapterId: created.chapter.id, content: deleteContent })
const deleted = await chapterTool.execute({ action: 'delete', chapterId: created.chapter.id, confirm: true }, {})
check('删除章节', deleted.deleted === created.chapter.id)
check('删除章节留下文件备份', Boolean(deleted.backupPath) && fs.existsSync(deleted.backupPath), String(deleted.backupPath))
const deletedBackup = deleted.backupPath && fs.existsSync(deleted.backupPath) ? JSON.parse(fs.readFileSync(deleted.backupPath, 'utf8')) : null
check('删除备份内容正确', deletedBackup?.content === deleteContent)
check('删除后库里没有该章', db.prepare('SELECT id FROM chapters WHERE id = ?').get(created.chapter.id) === undefined)

// 大纲 / 人物 / 连续性
const outlineTool = writer.tool('qibi_outline')
const createdOutline = await outlineTool.execute({ action: 'create', novelId: before.novelId, title: '自检总纲', content: '测试' }, {})
check('新建大纲', createdOutline.id > 0)
const outlineList = await outlineTool.execute({ action: 'list', novelId: before.novelId }, {})
const outlineToken = outlineList.outline.find(row => row.id === createdOutline.id)?.token
check('大纲读取带 token', typeof outlineToken === 'string' && outlineToken.length > 0)
let outlineConflict = null
try {
  await outlineTool.execute({ action: 'update', outlineId: createdOutline.id, content: '改过', expectedToken: 'deadbeefdeadbeef' }, {})
} catch (error) {
  outlineConflict = error
}
check('大纲旧 token 被拒', outlineConflict !== null && /ENTITY_CONFLICT/.test(outlineConflict.message), outlineConflict?.message)
const updatedOutline = await outlineTool.execute({ action: 'update', outlineId: createdOutline.id, content: '改过', expectedToken: outlineToken }, {})
check('修改大纲', updatedOutline.outline.some(row => row.id === createdOutline.id && row.content === '改过'))
await outlineTool.execute({ action: 'delete', outlineId: createdOutline.id }, {})
check('删除大纲', db.prepare('SELECT id FROM outlines WHERE id = ?').get(createdOutline.id) === undefined)

const characterTool = writer.tool('qibi_character')
const createdCharacter = await characterTool.execute({ action: 'create', novelId: before.novelId, name: '自检角色', role: '配角' }, {})
check('新建人物', createdCharacter.id > 0)
const charList = await characterTool.execute({ action: 'list', novelId: before.novelId }, {})
check('人物读取带 token', typeof charList.characters.find(row => row.id === createdCharacter.id)?.token === 'string')
const state = await characterTool.execute({ action: 'set_state', characterId: createdCharacter.id, location: '藏经阁', realm: '筑基三层' }, {})
check('写人物动态账本', state.state.location === '藏经阁' && state.state.realm === '筑基三层')
check('人物账本读取带 token', typeof state.state.token === 'string')
await characterTool.execute({ action: 'delete', characterId: createdCharacter.id }, {})
check('删除人物', db.prepare('SELECT id FROM characters WHERE id = ?').get(createdCharacter.id) === undefined)

const continuityTool = writer.tool('qibi_continuity')
const summary = await continuityTool.execute({ action: 'set_summary', chapterId: before.id, summary: '自检摘要', keyEvents: '事件', cliffhanger: '钩子' }, {})
check('写章节摘要', summary.summary.summary === '自检摘要')
check('章节摘要读取带 token', typeof summary.summary.token === 'string')
const writerState = await continuityTool.execute({ action: 'set_writer_state', novelId: before.novelId, progress: '自检进度' }, {})
check('写作品写作状态', writerState.writerState.progress === '自检进度')
check('写作状态读取带 token', typeof writerState.writerState.token === 'string')

// 知识库 + 检索
const kbTool = writer.tool('qibi_kb')
const indexedOutline = await outlineTool.execute({ action: 'create', novelId: before.novelId, title: '索引测试大纲', content: '大纲内容' }, {})
const indexedCharacter = await characterTool.execute({ action: 'create', novelId: before.novelId, name: '索引测试人物' }, {})
const outlineChunks = () => db.prepare("SELECT COUNT(*) AS c FROM kb_chunks WHERE novel_id = ? AND source_kind = 'outline' AND source_id = ?").get(before.novelId, indexedOutline.id).c
const characterChunks = () => db.prepare("SELECT COUNT(*) AS c FROM kb_chunks WHERE novel_id = ? AND source_kind = 'character' AND source_id = ?").get(before.novelId, indexedCharacter.id).c
check('新建大纲即写入分块', outlineChunks() > 0)
check('新建人物即写入分块', characterChunks() > 0)
const reindexed = await kbTool.execute({ action: 'reindex', novelId: before.novelId }, {})
check('整本重建知识库', reindexed.stats.chunks > 0)
check('重建索引保留大纲分块', outlineChunks() > 0)
check('重建索引保留人物分块', characterChunks() > 0)
await outlineTool.execute({ action: 'delete', outlineId: indexedOutline.id }, {})
await characterTool.execute({ action: 'delete', characterId: indexedCharacter.id }, {})
check('删除大纲清掉分块', outlineChunks() === 0)
check('删除人物清掉分块', characterChunks() === 0)
const hits = await kbTool.execute({ action: 'query', novelId: before.novelId, query: '自检追加' }, {})
check('BM25 检索能命中刚写入的句子', hits.hits.length > 0)

// 导出
const exportedNow = await writer.tool('qibi_export').execute({ novelId: before.novelId, format: 'txt' }, {})
check('导出 TXT 含正文', exportedNow.content.includes(before.content.slice(0, 40)))

// ---- 2b. 面板使用的 /api/qibi 端点（与工具同一层 store，但走另一条入口） ----
const hostNovel = await writer.call('createNovel', { title: '自检作品', author: '自检', genre: '测试', intro: '简介' })
check('面板端点 createNovel', hostNovel.ok === true && hostNovel.value?.novel?.id > 0, JSON.stringify(hostNovel.error ?? ''))
const hostNovelId = hostNovel.value?.novel?.id
const hostNovelUpdated = await writer.call('updateNovel', { novelId: hostNovelId, title: '自检作品改' })
check('面板端点 updateNovel', hostNovelUpdated.ok === true && hostNovelUpdated.value?.novel?.title === '自检作品改')

const hostChapter = await writer.call('createChapter', { novelId: hostNovelId, title: '自检章节' })
check('面板端点 createChapter', hostChapter.ok === true && hostChapter.value?.chapter?.id > 0)
const hostChapterId = hostChapter.value?.chapter?.id
const hostSaved = await writer.call('save', { chapterId: hostChapterId, content: '面板端点正文' })
check('面板端点 save', hostSaved.ok === true && hostSaved.value?.chapter?.content === '面板端点正文')
const hostChapterUpdated = await writer.call('updateChapter', { chapterId: hostChapterId, title: '自检章节改', status: '已发布' })
check('面板端点 updateChapter', hostChapterUpdated.ok === true && hostChapterUpdated.value?.chapter?.title === '自检章节改')
const hostMoved = await writer.call('moveChapter', { chapterId: hostChapterId, direction: 'down' })
check('面板端点 moveChapter', hostMoved.ok === true && typeof hostMoved.value?.moved === 'boolean')

const hostOutline = await writer.call('createOutline', { novelId: hostNovelId, title: '自检面板大纲', content: 'x' })
check('面板端点 createOutline', hostOutline.ok === true && hostOutline.value?.id > 0)
const hostOutlineUpdated = await writer.call('updateOutline', { outlineId: hostOutline.value?.id, content: 'y' })
check('面板端点 updateOutline', hostOutlineUpdated.ok === true && hostOutlineUpdated.value?.outline?.some(row => row.id === hostOutline.value?.id && row.content === 'y'))

const hostCharacter = await writer.call('createCharacter', { novelId: hostNovelId, name: '面板角色' })
check('面板端点 createCharacter', hostCharacter.ok === true && hostCharacter.value?.id > 0)
const hostCharacterId = hostCharacter.value?.id
const hostCharacterUpdated = await writer.call('updateCharacter', { characterId: hostCharacterId, personality: '冷静' })
check('面板端点 updateCharacter', hostCharacterUpdated.ok === true && hostCharacterUpdated.value?.characters?.some(row => row.id === hostCharacterId && row.personality === '冷静'))
const hostState = await writer.call('updateCharacterState', { characterId: hostCharacterId, location: '山门', realm: '练气' })
check('面板端点 updateCharacterState', hostState.ok === true && hostState.value?.location === '山门')
const hostStateRead = await writer.call('characterState', { characterId: hostCharacterId })
check('面板端点 characterState', hostStateRead.ok === true && hostStateRead.value?.location === '山门')

const hostVolume = await writer.call('createVolume', { novelId: hostNovelId, title: '自检卷', summary: '卷简介', coreConflict: '卷冲突' })
check('面板端点 createVolume', hostVolume.ok === true && hostVolume.value?.volumes?.length > 0)
const hostVolumeUpdated = await writer.call('updateVolume', { volumeId: hostVolume.value?.volumes?.[0]?.id, title: '自检卷改' })
check('面板端点 updateVolume', hostVolumeUpdated.ok === true && hostVolumeUpdated.value?.volumes?.some(row => row.title === '自检卷改'))

const hostSummary = await writer.call('updateChapterSummary', { chapterId: hostChapterId, summary: '面板摘要', keyEvents: '事件', cliffhanger: '钩子' })
check('面板端点 updateChapterSummary', hostSummary.ok === true && hostSummary.value?.summary?.summary === '面板摘要')
const hostSummaryRead = await writer.call('chapterSummary', { chapterId: hostChapterId })
check('面板端点 chapterSummary', hostSummaryRead.ok === true && hostSummaryRead.value?.summary?.summary === '面板摘要')

const hostWriterState = await writer.call('updateWriterState', { novelId: hostNovelId, progress: '面板进度', foreshadowing: '[]' })
check('面板端点 updateWriterState', hostWriterState.ok === true && hostWriterState.value?.writerState?.progress === '面板进度')
const hostWriterStateRead = await writer.call('writerState', { novelId: hostNovelId })
check('面板端点 writerState', hostWriterStateRead.ok === true && hostWriterStateRead.value?.writerState?.progress === '面板进度')

check('面板端点 kbStats', (await writer.call('kbStats', { novelId: hostNovelId })).ok === true)
const hostReindex = await writer.call('reindexNovel', { novelId: hostNovelId })
check('面板端点 reindexNovel', hostReindex.ok === true && Number(hostReindex.value?.chunks) >= 0)
const hostSearch = await writer.call('search', { novelId: hostNovelId, query: '面板' })
check('面板端点 search', hostSearch.ok === true && hostSearch.value?.chapters?.length > 0)
const hostKb = await writer.call('kbQuery', { novelId: hostNovelId, query: '面板', limit: 5 })
check('面板端点 kbQuery', hostKb.ok === true && Array.isArray(hostKb.value?.hits))
const hostExport = await writer.call('export', { novelId: hostNovelId, format: 'markdown' })
check('面板端点 export', hostExport.ok === true && hostExport.value?.content?.includes('面板端点正文'))

// 清理这条临时作品
await writer.call('deleteChapter', { chapterId: hostChapterId, confirm: true })
check('面板端点 deleteChapter', (await writer.call('chapter', { chapterId: hostChapterId })).ok === false)
await writer.call('deleteOutline', { outlineId: hostOutline.value?.id })
check('面板端点 deleteOutline', (await writer.call('outline', { novelId: hostNovelId })).value?.outline?.length === 0)
await writer.call('deleteCharacter', { characterId: hostCharacterId })
check('面板端点 deleteCharacter', (await writer.call('characters', { novelId: hostNovelId })).value?.characters?.length === 0)
const hostDeleted = await writer.call('deleteNovel', { novelId: hostNovelId, confirm: true })
check('面板端点 deleteNovel', hostDeleted.ok === true && hostDeleted.value?.deleted === hostNovelId)

// ---- 2c. 蒸馏作者（素材解析 / 分块上传 / 版本 / 绑定） ----
console.log('\n[2c] 蒸馏作者')
const distillTool = writer.tool('qibi_distill')
const distillAuthor = await distillTool.execute({ action: 'create', name: '自检蒸馏作者' }, {})
check('新建蒸馏作者', distillAuthor.id > 0)
const distillText = [
  '第一章 开端',
  '这是用于蒸馏的样本文本。'.repeat(40),
  '第二章 转折',
  '文风冷静，句子偏短。'.repeat(40),
  '第三章 结局',
  '收束干净。'.repeat(40),
].join('\n\n')
const distillSource = await distillTool.execute({ action: 'add_text', authorId: distillAuthor.id, filename: '自检材料.txt', content: distillText }, {})
check('粘贴素材并解析', distillSource.parsedChars > 0 && distillSource.chapterCount === 3)
const materialBefore = await distillTool.execute({ action: 'read', authorId: distillAuthor.id }, {})
check('read 返回素材与三段提示词', materialBefore.material.includes('第一章') && Boolean(materialBefore.prompts?.writing?.system))

const uploadText = ['第一章 上传', '通过分块上传的素材。'.repeat(50)].join('\n\n')
const initUpload = await writer.call('initDistilledSource', { authorId: distillAuthor.id, filename: '上传材料.txt', format: 'txt', sizeBytes: Buffer.byteLength(uploadText, 'utf8') })
check('面板端点 initDistilledSource', initUpload.ok === true && initUpload.value?.sourceId > 0)
const uploadB64 = Buffer.from(uploadText, 'utf8').toString('base64')
const appended = await writer.call('appendDistilledSource', { sourceId: initUpload.value.sourceId, offset: 0, base64: uploadB64 })
check('面板端点 appendDistilledSource', appended.ok === true && appended.value?.received === Buffer.byteLength(uploadText, 'utf8'))
const completed = await writer.call('completeDistilledSource', { sourceId: initUpload.value.sourceId })
check('面板端点 completeDistilledSource', completed.ok === true && completed.value?.status === 'ready' && completed.value?.parsedChars > 0)
const materialAfter = await distillTool.execute({ action: 'read', authorId: distillAuthor.id }, {})
check('read 汇总多份素材', materialAfter.sources.length === 2 && materialAfter.material.includes('上传'))

const savedV1 = await distillTool.execute({ action: 'save', authorId: distillAuthor.id, writingSkill: 'W1', authorPersona: 'P1', skillMarkdown: '# Skill v1\n规则一', sampleSummary: '第一版' }, {})
check('保存蒸馏版本 v1', savedV1.version?.version === 1)
const savedV2 = await distillTool.execute({ action: 'save', authorId: distillAuthor.id, writingSkill: 'W2', authorPersona: 'P2', skillMarkdown: '# Skill v2\n规则二', sampleSummary: '第二版' }, {})
check('保存蒸馏版本 v2', savedV2.version?.version === 2)
const versionList = await distillTool.execute({ action: 'versions', authorId: distillAuthor.id }, {})
check('蒸馏版本列表', versionList.versions?.length === 2)
const rolled = await distillTool.execute({ action: 'rollback', authorId: distillAuthor.id, versionId: savedV1.version.id }, {})
check('回滚蒸馏版本', rolled.currentVersionId === savedV1.version.id)

const bound = await distillTool.execute({ action: 'bind', authorId: distillAuthor.id, novelId: before.novelId }, {})
check('绑定蒸馏作者到作品', bound.writerState?.distilledAuthorId === distillAuthor.id)
await writer.call('select', { novelId: before.novelId, chapterId: before.id })
const styleSection = writer.state.sections.find(section => section.name === 'qibi-distill-style')
const styleLine = styleSection?.text?.({})
check('系统提示注入蒸馏 Skill', typeof styleLine === 'string' && styleLine.includes('Skill v1'), String(styleLine?.slice(0, 80)))

if (otherUser) {
  const foreign = await harness({ allowWrite: false, dataDir: sandbox, userId: otherUser.id })
  const foreignAuthors = await foreign.call('distilledAuthors')
  check('别人的蒸馏作者不可见', foreignAuthors.ok === true && foreignAuthors.value?.length === 0)
  const foreignRead = await foreign.call('distilledAuthor', { authorId: distillAuthor.id })
  check('别人的蒸馏作者不可读', foreignRead.ok === false)
  await foreign.dispose()
}

const distillPaths = db.prepare('SELECT stored_path FROM distilled_author_sources WHERE author_id = ?').all(distillAuthor.id).map(row => row.stored_path)
const deletedAuthor = await writer.call('deleteDistilledAuthor', { authorId: distillAuthor.id })
check('删除蒸馏作者', deletedAuthor.ok === true)
check('删除蒸馏作者清掉素材文件', distillPaths.length === 2 && distillPaths.every(file => !fs.existsSync(file)))
check('蒸馏作者已从库删除', db.prepare('SELECT COUNT(*) AS c FROM distilled_authors WHERE id = ?').get(distillAuthor.id).c === 0)
const stateAfterDelete = await writer.call('writerState', { novelId: before.novelId })
check('删除蒸馏作者解除作品绑定', stateAfterDelete.ok === true && stateAfterDelete.value?.writerState?.distilledAuthorId === null)

// ---- 2d. 面板内 AI（用宿主 llm 的桩） ----
console.log('\n[2d] 面板内 AI')
const llmStub = {
  lastOptions: null,
  finishKind: 'stop',
  async *stream(options) {
    this.lastOptions = options
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: '润色后' }
    yield { type: 'text-delta', index: 0, text: '的正文' }
    yield { type: 'finish', reason: { kind: this.finishKind } }
  },
}
const aiHarness = await harness({ allowWrite: false, dataDir: sandbox }, {
  llm: llmStub,
  agentDefaultModel: { currentSelection: () => ({ provider: 'test-provider', model: 'test-model' }) },
})
const aiInfo = await aiHarness.call('aiInfo')
check('aiInfo 报告可用模型', aiInfo.ok === true && aiInfo.value?.available === true && aiInfo.value?.model === 'test-provider/test-model', JSON.stringify(aiInfo.value ?? aiInfo.error))
const aiRoute = aiHarness.state.routes.find(route => route.path === '/api/qibi/ai')
check('注册了 /api/qibi/ai 路由', Boolean(aiRoute))
if (aiRoute) {
  const aiResponse = await aiRoute.fetch(new Request('http://localhost/api/qibi/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode: 'polish-selection', novelId: before.novelId, chapterId: before.id, content: '原文段落', extra: '' }),
  }))
  check('AI 路由返回 SSE', String(aiResponse.headers.get('content-type') ?? '').includes('text/event-stream'))
  const sse = await aiResponse.text()
  check('SSE 有增量与 done', sse.includes('"type":"delta"') && sse.includes('"type":"done"'))
  const sent = llmStub.lastOptions?.messages?.[0]?.content?.[0]?.text ?? ''
  check('请求带 system 与选中文本', String(llmStub.lastOptions?.system ?? '').includes('小说') && sent.includes('选中文本'))
  check('上下文包含作品信息', sent.includes('【作品】'))
  check('使用默认模型', llmStub.lastOptions?.provider === 'test-provider' && llmStub.lastOptions?.model === 'test-model')

  const badResponse = await aiRoute.fetch(new Request('http://localhost/api/qibi/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode: 'nope', novelId: before.novelId }),
  }))
  check('未知 AI 模式被拒绝', badResponse.ok === false && badResponse.status === 400)

  llmStub.finishKind = 'max-tokens'
  const truncatedResponse = await aiRoute.fetch(new Request('http://localhost/api/qibi/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode: 'polish-selection', novelId: before.novelId, chapterId: before.id, content: '原文段落', extra: '' }),
  }))
  const truncatedSse = await truncatedResponse.text()
  const doneLine = truncatedSse.split('\n').find(line => line.includes('"type":"done"'))
  const doneEvent = doneLine ? JSON.parse(doneLine.slice(6)) : null
  check('长度截断标记为 truncated', doneEvent?.truncated === true && doneEvent?.text === '润色后的正文')
  llmStub.finishKind = 'stop'
}
const noAi = await readOnly.call('aiInfo')
check('没有模型时报告不可用', noAi.ok === true && noAi.value?.available === false)
await aiHarness.dispose()

db.close()
await writer.dispose()
fs.rmSync(sandbox, { recursive: true, force: true })

// ---- 3. 真实库未被写入 ----
console.log('\n[3] 真实库回归')
const realCheck = new DatabaseSync(realDb, { readOnly: true })
const realChapter = realCheck.prepare('SELECT content FROM chapters WHERE id = ?').get(chapterMeta.id)
check('真实库正文未被改动', !String(realChapter?.content ?? '').includes('自检追加的一句正文。'))
check('真实库没有自检新章', realCheck.prepare("SELECT COUNT(*) AS c FROM chapters WHERE title = '自检新章'").get().c === 0)
check('真实库没有自检人物', realCheck.prepare("SELECT COUNT(*) AS c FROM characters WHERE name = '自检角色'").get().c === 0)
realCheck.close()

// ---- 4. 系统提示 ----
console.log('\n[4] 系统提示')
await readOnly.call('select', { novelId: novel.id, chapterId: chapterMeta.id })
const line = readOnly.state.sections[0]?.text?.({})
check('选中章节后注入一行上下文', typeof line === 'string' && line.includes('起笔') && line.includes(chapterMeta.title), String(line))

// ---- 5. 浏览器半边渲染冒烟 ----
console.log('\n[5] client.js 渲染')
// 白屏通常是组件在渲染期抛错（例如 useCallback 引用了声明在前面的变量）。
// 这里用最小 React 桩真实执行一次两个 slot 组件，任何抛错都算失败。
const clientSource = fs.readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const vm = await import('node:vm')
const reactStub = {
  createElement() { return null },
  Fragment: 'Fragment',
  useState(init) { return [typeof init === 'function' ? init() : init, () => {}] },
  useEffect() {},
  useRef(init) { return { current: init } },
  useCallback(fn) { return fn },
  useMemo(fn) { return fn() },
}
let clientModule = null
const clientSandbox = {
  window: { __ModuleLoader__: { load({ factory }) { clientModule = factory(() => reactStub) } } },
  console,
  setTimeout, clearTimeout, setInterval, clearInterval,
  navigator: { clipboard: { writeText: async () => {} } },
}
vm.runInNewContext(clientSource, clientSandbox)
check('client.js 能加载', typeof clientModule?.apply === 'function')
const clientSlots = []
const clientCtx = {
  effect(fn) { return fn() },
  locale: { register() {}, bind() { return key => key } },
  slots: {
    inject(name, fn) { fn() },
    register(spec, component) { clientSlots.push({ spec, component }); return () => {} },
  },
}
let clientError = null
try {
  clientModule.apply(clientCtx)
  for (const { spec, component } of clientSlots) {
    component(spec.inject ? spec.inject() : {})
  }
} catch (error) {
  clientError = error
}
check('client.js 两个 slot 渲染无异常', clientSlots.length >= 2 && clientError === null, clientError?.message ?? '')
check('注册了 main 面板与侧栏图标', clientSlots.some(slot => slot.spec.name === 'main') && clientSlots.some(slot => slot.spec.name === 'sidebar.panellist'))

// ---- 6. 浏览器半边：渲染与锚点 ----
console.log('\n[6] 浏览器半边')
try {
  const { renderAiDrawer } = await import('./render-check.mjs')
  const html = await renderAiDrawer()
  const required = ['qibi-ai-overlay', 'qibi-ai-drawer', 'qibi-ai-head', 'qibi-ai-close', 'qibi-presets', 'qibi-ai-note']
  const missing = required.filter(token => !html.includes(token))
  check('抽屉渲染无异常，带遮罩与关闭按钮', missing.length === 0, missing.join(', '))
} catch (error) {
  check('抽屉渲染无异常，带遮罩与关闭按钮', false, error.message)
}
try {
  const { checkOutlineAnchors } = await import('./render-check.mjs')
  await checkOutlineAnchors()
  check('细纲锚点：只匹配当前章、自定义优先、待写标记', true)
} catch (error) {
  check('细纲锚点：只匹配当前章、自定义优先、待写标记', false, error.message)
}
try {
  const { checkUndoHistory } = await import('./render-check.mjs')
  await checkUndoHistory()
  check('撤销/重做：程序化改写与连续输入合并', true)
} catch (error) {
  check('撤销/重做：程序化改写与连续输入合并', false, error.message)
}

console.log('')
if (failures.length > 0) {
  console.error(`自检失败 ${failures.length} 项：`)
  for (const item of failures) console.error(` - ${item}`)
  process.exit(1)
}
console.log('自检全部通过。')
