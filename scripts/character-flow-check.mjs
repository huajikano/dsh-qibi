import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { ensureEmptyDatabase } from '../lib/database.js'
import { activate } from '../lib/host.js'

// A real, isolated schema and real Host routes/tools; no manuscript or network model access.
const prefix = 'dsh-qibi-character-flow-'
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
const ownedDirectory = fs.realpathSync(sandbox)
const cleanup = []
const handles = []
const fields = ['name', 'alias', 'role', 'gender', 'age', 'appearance', 'personality', 'background']
const candidate = (name, extra = {}) => Object.fromEntries(fields.map(field => [field, field === 'name' ? name : extra[field] ?? '']))
const modelKey = 'fixture/character-flow'
let passed = 0
async function check(name, run) {
  await run()
  passed += 1
  console.log(`PASS: ${name}`)
}

async function host({ allowWrite = true, userId = 1 } = {}) {
  const calls = []
  const tools = []
  const routes = []
  let output = JSON.stringify({ characters: [candidate('林舟', { role: '主角' })] })
  const llm = {
    async resolveModelInfo(provider, id) {
      return { provider, id, reasoning: { efforts: [{ id: 'low', name: '低' }, { id: 'strong', name: '强' }], defaultEffort: 'low' } }
    },
    async *stream(options) {
      calls.push(options)
      yield { type: 'text-delta', index: 0, text: output.slice(0, 10) }
      yield { type: 'text-delta', index: 0, text: output.slice(10) }
      yield { type: 'finish', reason: { kind: 'stop' } }
    },
  }
  const ctx = {
    get(name) {
      if (name === 'llm') return llm
      if (name === 'agentDefaultModel') return { currentSelection: () => ({ provider: 'fixture', model: 'character-flow', reasoningEffort: 'low' }) }
      return undefined
    },
    effect(fn) { const off = fn(); if (typeof off === 'function') cleanup.push(off); return off },
    connection: { fetch: { register(route) { routes.push(route); return async () => {} } } },
    tools: { register(tool) { tools.push(tool); return () => {} } },
    systemPrompt: { section() { return () => {} } },
  }
  await activate(ctx, { dataDir: sandbox, allowWrite, userId })
  const route = routes.find(row => row.path === '/api/qibi')
  assert.ok(route, 'Host must register the real /api/qibi route')
  const characterTool = tools.find(row => row.name === 'qibi_character')
  assert.ok(characterTool, 'Host must register the real character tool')
  const raw = async (endpoint, payload = {}) => {
    const response = await route.fetch(new Request('http://fixture/api/qibi', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint, payload }),
    }))
    return response.json()
  }
  const call = async (endpoint, payload = {}) => {
    const envelope = await raw(endpoint, payload)
    assert.equal(envelope.ok, true, `${endpoint} failed: ${JSON.stringify(envelope.error)}`)
    return envelope.value
  }
  const failure = async (endpoint, payload, code) => {
    const envelope = await raw(endpoint, payload)
    assert.equal(envelope.ok, false, `${endpoint} must fail`)
    assert.ok(envelope.error?.message?.length > 3)
    if (code) assert.equal(envelope.error.code, code)
    return envelope.error
  }
  return { calls, raw, call, failure, tool: characterTool, execute: args => Promise.resolve().then(() => characterTool.execute(args)), output(value) { output = typeof value === 'string' ? value : JSON.stringify(value) } }
}

try {
  const initialized = ensureEmptyDatabase(sandbox, { mustCreate: true })
  const db = new DatabaseSync(initialized.dbPath)
  handles.push(db)
  db.exec('PRAGMA foreign_keys = ON')
  db.prepare('INSERT INTO users (id, username, password_hash) VALUES (2, ?, ?)').run('合成外部作者', '!FIXTURE_ONLY!')
  const addNovel = db.prepare('INSERT INTO novels (id, user_id, title, intro) VALUES (?, ?, ?, ?)')
  addNovel.run(1, 1, '人物流程夹具', '雾港中的少年与钟楼。')
  addNovel.run(2, 1, '同作者外书', '外书简介。')
  addNovel.run(3, 2, '另一作者作品', '跨作者资料不可见。')
  const addChapter = db.prepare('INSERT INTO chapters (id, novel_id, title, content, sort_order) VALUES (?, ?, ?, ?, ?)')
  addChapter.run(10, 1, '第一章', '林舟穿着旧灰衣，守在钟楼门前。', 1)
  addChapter.run(11, 1, '第二章', '沈砚提着灯，推开木门。', 2)
  addChapter.run(20, 2, '外书章节', '外书秘密人物不应被读取。', 1)
  addChapter.run(30, 3, '跨作者章节', '跨作者秘密正文。', 1)
  db.prepare('INSERT INTO characters (novel_id, name, role, background) VALUES (?, ?, ?, ?)').run(1, 'Alice', '既有角色', '必须保留原背景')
  const list = () => db.prepare('SELECT id, novel_id, name, alias, role, gender, age, appearance, personality, background FROM characters ORDER BY id').all().map(row => ({ ...row }))
  const chapters = () => db.prepare('SELECT id, novel_id, content FROM chapters ORDER BY id').all().map(row => ({ ...row }))
  const chapterSnapshot = chapters()
  const writable = await host()
  await writable.call('select', { novelId: 1, chapterId: 10 })

  await check('API 提取与一句话生成仅预览，显式 strong 档位到达模型', async () => {
    const before = list()
    const result = await writable.call('characterAi', { novelId: 1, action: 'extract', scope: 'chapter', chapterId: 10, modelKey, reasoningEffort: 'strong' })
    assert.deepEqual(result.characters.map(row => row.name), ['林舟'])
    assert.deepEqual(result.source, { scope: 'chapter', analyzedChapters: 1, availableChapters: 1, truncated: false })
    assert.equal(writable.calls.at(-1).reasoningEffort, 'strong')
    assert.ok(writable.calls.at(-1).signal instanceof AbortSignal)
    writable.output(candidate('钟离', { personality: '谨慎' }))
    const generated = await writable.call('characterAi', { novelId: 1, action: 'generate', idea: '害怕海水的年轻领航员', modelKey, reasoningEffort: 'strong' })
    assert.equal(generated.characters[0].name, '钟离')
    assert.deepEqual(generated.source, { scope: 'idea', analyzedChapters: 0, availableChapters: 0, truncated: false })
    assert.match(writable.calls.at(-1).messages[0].content[0].text, /Alice/)
    assert.deepEqual(list(), before)
  })
  await check('工具 schema 暴露三动作与候选结构，省略作品使用选中', async () => {
    const properties = writable.tool.parameters.properties
    for (const action of ['ai_extract', 'ai_generate', 'import_candidates']) assert.ok(properties.action.enum.includes(action))
    for (const field of ['idea', 'scope', 'chapterId', 'characters', 'modelKey', 'reasoningEffort']) assert.ok(properties[field], `missing parameter ${field}`)
    assert.equal(properties.characters.type, 'array')
    assert.equal(properties.characters.items.type, 'object')
    for (const field of fields) assert.equal(properties.characters.items.properties[field].type, 'string')
    const before = list()
    writable.output({ characters: [candidate('工具提取')] })
    const extracted = await writable.execute({ action: 'ai_extract', scope: 'chapter', chapterId: 10, modelKey, reasoningEffort: 'strong' })
    assert.equal(extracted.characters[0].name, '工具提取')
    assert.equal(extracted.source.scope, 'chapter')
    assert.equal(writable.calls.at(-1).reasoningEffort, 'strong')
    writable.output(candidate('工具生成'))
    const generated = await writable.execute({ action: 'ai_generate', idea: '守钟人', modelKey, reasoningEffort: 'strong' })
    assert.equal(generated.characters[0].name, '工具生成')
    assert.equal(generated.source.scope, 'idea')
    assert.deepEqual(list(), before)
  })
  await check('API 与工具共享模型档位校验，未知档位和过期模型均不生成', async () => {
    const count = writable.calls.length
    const invalid = await writable.failure('characterAi', { novelId: 1, action: 'generate', idea: '一句话', modelKey, reasoningEffort: 'unknown' })
    assert.match(invalid.code, /REASONING/)
    await assert.rejects(writable.execute({ action: 'ai_generate', idea: '一句话', modelKey, reasoningEffort: 'unknown' }), /档位|强度|REASONING/)
    await writable.failure('characterAi', { novelId: 1, action: 'generate', idea: '一句话', modelKey: 'fixture/stale', reasoningEffort: 'strong' }, 'AI_MODEL_UNAVAILABLE')
    await assert.rejects(writable.execute({ action: 'ai_generate', idea: '一句话', modelKey: 'fixture/stale', reasoningEffort: 'strong' }), /模型|AI_MODEL_CHANGED/)
    assert.equal(writable.calls.length, count)
  })
  await check('API 确认批量导入，NFKC/大小写/批内重复跳过且不覆盖', async () => {
    const imported = await writable.call('importCharacters', { novelId: 1, characters: [candidate('ＡＬＩＣＥ', { background: '不能覆盖' }), candidate('alice'), candidate('林舟', { role: '主角' }), candidate(' 林舟 ')] })
    assert.equal(imported.created, 1)
    assert.equal(imported.skipped, 3)
    assert.deepEqual(imported.characters.map(row => row.name), ['Alice', '林舟'])
    assert.equal(imported.characters[0].background, '必须保留原背景')
    assert.equal(imported.characters[1].role, '主角')
    assert.equal(list().filter(row => row.novel_id === 1).length, 2)
  })
  await check('工具确认导入使用同一批量服务，并返回完整人物库', async () => {
    const imported = await writable.execute({ action: 'import_candidates', characters: [candidate('沈砚'), candidate('Ａlice', { background: '仍不能覆盖' })] })
    assert.equal(imported.created, 1)
    assert.equal(imported.skipped, 1)
    assert.deepEqual(imported.characters.map(row => row.name), ['Alice', '林舟', '沈砚'])
    assert.equal(imported.characters[0].background, '必须保留原背景')
  })
  await check('无效整批先验证，API 和工具均不会部分落库', async () => {
    const before = list()
    const invalid = [candidate('不可部分写入'), { ...candidate('无效字段'), background: { bad: true } }]
    await writable.failure('importCharacters', { novelId: 1, characters: invalid })
    assert.deepEqual(list(), before)
    await assert.rejects(writable.execute({ action: 'import_candidates', characters: invalid }))
    assert.deepEqual(list(), before)
    await writable.failure('importCharacters', { novelId: 1, characters: [candidate('另一个不可写入'), candidate('  ')] })
    assert.deepEqual(list(), before)
  })
  await check('SQL 中途失败整批事务回滚，人物与知识索引均无部分写入', async () => {
    const before = list()
    const indexBefore = db.prepare('SELECT COUNT(*) AS count FROM kb_chunks').get().count
    db.exec("CREATE TRIGGER fixture_character_abort BEFORE INSERT ON characters WHEN NEW.name = '触发回滚' BEGIN SELECT RAISE(ABORT, 'fixture transaction rollback'); END")
    await writable.failure('importCharacters', { novelId: 1, characters: [candidate('事务先行候选'), candidate('触发回滚')] })
    assert.deepEqual(list(), before)
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM kb_chunks').get().count, indexBefore)
    db.exec('DROP TRIGGER fixture_character_abort')
  })
  await check('预览后其他连接已建同名角色，确认时重新查重并保留并发版本', async () => {
    writable.output(candidate('并发候选', { background: '预览版本' }))
    const preview = await writable.call('characterAi', { novelId: 1, action: 'generate', idea: '另一个守夜人' })
    // This connection is independent of the Host store connection.
    db.prepare('INSERT INTO characters (novel_id, name, background, sort_order) VALUES (?, ?, ?, ?)').run(1, '并发候选', '其他连接已创建', 99)
    const imported = await writable.call('importCharacters', { novelId: 1, characters: preview.characters })
    assert.equal(imported.created, 0)
    assert.equal(imported.skipped, 1)
    assert.equal(imported.characters.find(row => row.name === '并发候选').background, '其他连接已创建')
  })
  await check('作品与章节权限在 API 和工具路径一致，拒绝时不调用模型', async () => {
    const count = writable.calls.length
    const before = list()
    await writable.failure('characterAi', { novelId: 3, action: 'extract', scope: 'all' }, 'NOVEL_NOT_FOUND')
    await writable.failure('characterAi', { novelId: 1, action: 'extract', chapterId: 20 }, 'CHAPTER_NOT_FOUND')
    await writable.failure('characterAi', { novelId: 1, action: 'extract', chapterId: 30 }, 'CHAPTER_NOT_FOUND')
    await writable.failure('importCharacters', { novelId: 3, characters: [candidate('越权候选')] }, 'NOVEL_NOT_FOUND')
    await assert.rejects(writable.execute({ action: 'ai_extract', novelId: 3, scope: 'all' }))
    await assert.rejects(writable.execute({ action: 'import_candidates', novelId: 3, characters: [candidate('越权工具候选')] }))
    assert.equal(writable.calls.length, count)
    assert.deepEqual(list(), before)
    const otherAuthor = await host({ userId: 2 })
    assert.deepEqual((await otherAuthor.call('novels')).novels.map(row => row.id), [3])
    await otherAuthor.failure('characterAi', { novelId: 1, action: 'generate', idea: '不可见' }, 'NOVEL_NOT_FOUND')
    await otherAuthor.failure('importCharacters', { novelId: 1, characters: [candidate('跨用户候选')] }, 'NOVEL_NOT_FOUND')
    assert.equal(otherAuthor.calls.length, 0)
    assert.deepEqual(list(), before)
  })
  await check('只读配置和面板写入开关拒绝导入，仍允许只预览', async () => {
    const before = list()
    const readOnly = await host({ allowWrite: false })
    await readOnly.call('select', { novelId: 1, chapterId: 10 })
    readOnly.output(candidate('只读预览'))
    assert.equal((await readOnly.call('characterAi', { novelId: 1, action: 'generate', idea: '仅预览' })).characters[0].name, '只读预览')
    await readOnly.failure('importCharacters', { novelId: 1, characters: [candidate('只读不可写')] }, 'READ_ONLY')
    await assert.rejects(readOnly.execute({ action: 'import_candidates', characters: [candidate('只读工具不可写')] }), /READ_ONLY|只读/)
    await writable.call('writable', { writable: false })
    await writable.failure('importCharacters', { novelId: 1, characters: [candidate('关闭写入不可写')] }, 'WRITE_DISABLED')
    await assert.rejects(writable.execute({ action: 'import_candidates', characters: [candidate('关闭写入工具不可写')] }), /READ_ONLY|写入|只读/)
    await writable.call('writable', { writable: true })
    assert.deepEqual(list(), before)
  })
  await check('整个流程未修改正文或创建正文修订，候选确认前后可区分', async () => {
    assert.deepEqual(chapters(), chapterSnapshot)
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM chapter_revisions').get().count, 0)
    assert.equal(list().length, 4)
    assert.ok(!list().some(row => ['钟离', '工具提取', '工具生成', '只读预览'].includes(row.name)))
  })
  console.log(`PASS: ${passed} character flow checks; real Host/API/tool integration, synthetic database and fake LLM only.`)
} finally {
  for (const off of cleanup.reverse()) await off()
  for (const handle of handles.reverse()) handle.close()
  assert.equal(path.dirname(ownedDirectory), fs.realpathSync(os.tmpdir()))
  assert.ok(path.basename(ownedDirectory).startsWith(prefix))
  assert.equal(fs.realpathSync(sandbox), ownedDirectory)
  assert.equal(fs.lstatSync(sandbox).isSymbolicLink(), false)
  fs.rmSync(ownedDirectory, { recursive: true, force: true })
}
