import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { ensureEmptyDatabase } from '../lib/database.js'
import { QibiStore } from '../lib/store.js'
import { generateCharacterCandidates } from '../lib/character-ai.js'

// This check owns a brand-new directory. Never open the default author database.
const prefix = 'dsh-qibi-character-ai-'
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
const ownedDirectory = fs.realpathSync(sandbox)
const handles = []
const selection = { provider: 'fixture', model: 'characters', reasoningEffort: 'low' }
let passed = 0
async function check(name, run) {
  await run()
  passed += 1
  console.log(`PASS: ${name}`)
}
function fake(output = '[{"name":"林舟"}]', finish = 'stop') {
  const calls = []
  return {
    calls,
    async *stream(options) {
      calls.push(options)
      for (let offset = 0; offset < output.length; offset += 19) {
        yield { type: 'text-delta', index: 0, text: output.slice(offset, offset + 19) }
      }
      if (finish) yield { type: 'finish', reason: { kind: finish } }
    },
  }
}
const errorCode = code => error => {
  assert.equal(error.code, code)
  assert.ok(error.message.length > 3, 'errors must explain the failure')
  return true
}
try {
  const initialized = ensureEmptyDatabase(sandbox, { mustCreate: true })
  const seed = new DatabaseSync(initialized.dbPath)
  handles.push(seed)
  seed.prepare('INSERT INTO users (id, username, password_hash) VALUES (2, ?, ?)').run('合成第二作者', '!FIXTURE!')
  const addNovel = seed.prepare('INSERT INTO novels (id, user_id, title, intro) VALUES (?, ?, ?, ?)')
  addNovel.run(1, 1, '雾港夹具', '港口少年与旧钟塔。' + '简介填充'.repeat(1000))
  addNovel.run(2, 1, '同作者另一书', '只在另一书可见')
  addNovel.run(3, 2, '另一作者的书', '禁止泄漏的简介')
  addNovel.run(4, 1, '长篇预算夹具', '')
  addNovel.run(5, 1, '章节数预算夹具', '')
  addNovel.run(6, 1, '空书夹具', '')
  const addChapter = seed.prepare('INSERT INTO chapters (id, novel_id, title, content, sort_order, word_count) VALUES (?, ?, ?, ?, ?, ?)')
  // The chapter order deliberately differs from the id order; word_count is not evidence of emptiness.
  addChapter.run(10, 1, '后章', '沈砚低声说：“林舟，明天见。”', 2, 0)
  addChapter.run(11, 1, '空章', ' \n\t ', 0, 0)
  addChapter.run(12, 1, '前章', '林舟是个沉默的少年，穿着旧灰衣。', 1, 0)
  addChapter.run(20, 2, '外书章', '外书秘密人物。', 1, 7)
  addChapter.run(30, 3, '跨作者章', '跨作者秘密人物。', 1, 8)
  for (let index = 0; index < 6; index += 1) {
    addChapter.run(100 + index, 4, `长章${index}`, String.fromCharCode(0x7532 + index).repeat(7000), index, 7000)
  }
  for (let index = 0; index < 55; index += 1) addChapter.run(200 + index, 5, `短章${index}`, `角色${index}走过。`, index, 0)
  seed.prepare('INSERT INTO characters (novel_id, name, background) VALUES (?, ?, ?)').run(1, '旧角色', '既有人物不应被写改')
  seed.close()
  handles.pop()
  const store = new QibiStore({ dataDir: sandbox, userId: 1, allowWrite: false })
  handles.push(store)
  const invoke = (input, llm = fake(), extra = {}) => generateCharacterCandidates({ store, input: { novelId: 1, ...input }, selection, llm, ...extra })
  const before = { characters: store.characters(1), chapters: store.chapters(1).map(row => store.chapter(row.id)), rev: store.rev }

  await check('空正文和空书不调用 LLM', async () => {
    const llm = fake()
    await assert.rejects(invoke({ action: 'extract', scope: 'chapter', chapterId: 11 }, llm), errorCode('EMPTY_CONTENT'))
    await assert.rejects(invoke({ novelId: 6, action: 'extract', scope: 'all' }, llm), errorCode('EMPTY_CONTENT'))
    assert.equal(llm.calls.length, 0)
  })
  await check('本章提取收集完整流，字段白名单、去重和完整来源', async () => {
    const llm = fake('<think>这是不应该返回的推理。</think>\n```json\n' + JSON.stringify({ characters: [{ name: ' 林舟 ', role: '主角', appearance: '旧灰衣', ignored: { unsafe: true } }, { name: '林舟', background: '重复候选' }, { name: '沈砚' }] }) + '\n```')
    const controller = new AbortController()
    const result = await invoke({ action: 'extract', chapterId: 12 }, llm, { signal: controller.signal })
    assert.deepEqual(result.characters.map(row => row.name), ['林舟', '沈砚'])
    assert.deepEqual(Object.keys(result.characters[0]), ['name', 'alias', 'role', 'gender', 'age', 'appearance', 'personality', 'background'])
    assert.equal(result.characters[0].gender, '')
    assert.deepEqual(result.source, { scope: 'chapter', analyzedChapters: 1, availableChapters: 1, truncated: false })
    const options = llm.calls[0]
    assert.equal(options.provider, selection.provider)
    assert.equal(options.model, selection.model)
    assert.equal(options.reasoningEffort, 'low')
    assert.equal(options.signal, controller.signal)
    assert.ok([4096, 6000].includes(options.maxTokens))
    assert.match(options.system, /JSON/)
    assert.match(options.system + options.messages[0].content[0].text, /未知|证据/)
    assert.match(options.messages[0].content[0].text, /林舟是个沉默的少年/)
    assert.doesNotMatch(options.messages[0].content[0].text, /明天见/)
  })
  await check('一句话创作仅一个角色，有限简介与既有人名上下文', async () => {
    const llm = fake('{"name":"钟离","age":"十九","personality":"谨慎"}')
    const result = await invoke({ action: 'generate', idea: '一个害怕海水的年轻领航员' }, llm)
    assert.equal(result.characters.length, 1)
    assert.equal(result.characters[0].name, '钟离')
    assert.deepEqual(result.source, { scope: 'idea', analyzedChapters: 0, availableChapters: 0, truncated: false })
    const prompt = llm.calls[0].messages[0].content[0].text
    assert.match(prompt, /一个害怕海水的年轻领航员/)
    assert.match(prompt, /港口少年与旧钟塔/)
    assert.match(prompt, /旧角色/)
    assert.match(prompt, /重复/)
    assert.ok(prompt.length < 6000)
    assert.doesNotMatch(prompt, /明天见|林舟是个沉默的少年/)
  })
  await check('请求验证在 LLM 前拒绝非法输入', async () => {
    const llm = fake()
    for (const input of [
      { action: 'unknown' }, { action: 'extract', scope: 'bad' }, { action: 'extract' },
      { action: 'extract', chapterId: 12.5 }, { action: 'extract', scope: 'all', maxChapters: 0 },
      { action: 'extract', scope: 'all', maxChapters: 1.5 }, { action: 'generate', idea: '  ' },
      { action: 'generate', idea: '字'.repeat(2001) }, { action: 'generate', idea: 5 },
      { novelId: -1, action: 'generate', idea: '一句话' },
    ]) await assert.rejects(invoke(input, llm), errorCode('BAD_ARGUMENT'))
    assert.equal(llm.calls.length, 0)
  })
  await check('外书章节前置拒绝，不会调用 chapter 读取', async () => {
    const reads = []
    const guarded = { novels: () => store.novels(), chapters: id => store.chapters(id), characters: id => store.characters(id), chapter(id) { reads.push(id); return store.chapter(id) } }
    const llm = fake()
    for (const chapterId of [20, 30, 999999]) {
      for (const action of [{ action: 'extract' }, { action: 'extract', scope: 'all' }, { action: 'generate', idea: '一句话' }]) {
        await assert.rejects(generateCharacterCandidates({ store: guarded, input: { novelId: 1, ...action, chapterId }, selection, llm }), errorCode('CHAPTER_NOT_FOUND'))
      }
    }
    assert.deepEqual(reads, [])
    assert.equal(llm.calls.length, 0)
  })
  await check('跨用户作品不可见；读后再次校验章节所属作品', async () => {
    const llm = fake()
    await assert.rejects(invoke({ novelId: 3, action: 'extract', scope: 'all' }, llm), errorCode('NOVEL_NOT_FOUND'))
    const moved = { novels: () => store.novels(), chapters: id => store.chapters(id), chapter: id => ({ ...store.chapter(id), novelId: 2 }) }
    await assert.rejects(generateCharacterCandidates({ store: moved, input: { novelId: 1, action: 'extract', chapterId: 12 }, selection, llm }), errorCode('CHAPTER_NOT_FOUND'))
    assert.equal(llm.calls.length, 0)
  })
  await check('坏 JSON、坏字段、超长和过多候选可读失败', async () => {
    const cases = [
      ['{"characters":[', 'INVALID_CHARACTER_JSON'],
      ['说明：[{"name":"人名"}]', 'INVALID_CHARACTER_JSON'],
      ['<think>未闭合[{"name":"人名"}]', 'INVALID_CHARACTER_JSON'],
      ['```json\n[{"name":"人名"}]', 'INVALID_CHARACTER_JSON'],
      [JSON.stringify([{ name: '人名', background: {} }]), 'INVALID_CHARACTER_DATA'],
      [JSON.stringify([{ name: '人名', age: 12 }]), 'INVALID_CHARACTER_DATA'],
      [JSON.stringify([{ name: '  ' }]), 'INVALID_CHARACTER_DATA'],
      [JSON.stringify([{ name: '名'.repeat(81) }]), 'INVALID_CHARACTER_DATA'],
      [JSON.stringify([{ name: '人名', background: '字'.repeat(4001) }]), 'INVALID_CHARACTER_DATA'],
      [JSON.stringify(Array.from({ length: 31 }, (_, index) => ({ name: `候选${index}` }))), 'INVALID_CHARACTER_DATA'],
    ]
    for (const [output, code] of cases) await assert.rejects(invoke({ action: 'extract', chapterId: 12 }, fake(output)), errorCode(code))
    await assert.rejects(invoke({ action: 'generate', idea: '一句话' }, fake('[{"name":"甲"},{"name":"乙"}]')), errorCode('INVALID_CHARACTER_DATA'))
    await assert.rejects(invoke({ action: 'generate', idea: '一句话' }, fake('[]')), errorCode('INVALID_CHARACTER_DATA'))
  })
  await check('模型 token 截断、未完成流与输出上限均不能返回部分候选', async () => {
    await assert.rejects(invoke({ action: 'extract', chapterId: 12 }, fake('[{"name":"林舟"}]', 'max-tokens')), errorCode('MAX_TOKENS'))
    await assert.rejects(invoke({ action: 'extract', chapterId: 12 }, fake('[{"name":"林舟"}]', null)), errorCode('INCOMPLETE_STREAM'))
    await assert.rejects(invoke({ action: 'extract', chapterId: 12 }, fake(' '.repeat(40001))), errorCode('OUTPUT_TOO_LONG'))
    await assert.rejects(invoke({ action: 'extract', chapterId: 12 }, fake('[]', 'error')), errorCode('LLM_ERROR'))
    await assert.rejects(invoke({ action: 'extract', chapterId: 12 }, fake('[]', 'aborted')), errorCode('ABORTED'))
  })
  await check('预先取消与流中取消都拒绝结果并转发 signal', async () => {
    const beforeController = new AbortController()
    beforeController.abort()
    const noCall = fake()
    await assert.rejects(invoke({ action: 'generate', idea: '一句话' }, noCall, { signal: beforeController.signal }), errorCode('ABORTED'))
    assert.equal(noCall.calls.length, 0)
    const controller = new AbortController()
    let sawSignal = false
    const llm = { async *stream(options) { sawSignal = options.signal === controller.signal; yield { type: 'text-delta', text: '[' }; controller.abort(); yield { type: 'text-delta', text: '{"name":"半途"}]' }; yield { type: 'finish', reason: { kind: 'stop' } } } }
    await assert.rejects(invoke({ action: 'extract', chapterId: 12 }, llm, { signal: controller.signal }), errorCode('ABORTED'))
    assert.equal(sawSignal, true)
  })
  await check('全书按实际章序跳过空章，章节上限和全文预算明确截断', async () => {
    const llm = fake('[]')
    const result = await invoke({ action: 'extract', scope: 'all', maxChapters: 1 }, llm)
    assert.deepEqual(result.source, { scope: 'all', analyzedChapters: 1, availableChapters: 3, truncated: true })
    const prompt = llm.calls[0].messages[0].content[0].text
    assert.match(prompt, /林舟是个沉默的少年/)
    assert.doesNotMatch(prompt, /明天见/)
    assert.match(prompt, /截断|未分析/)
    const completeLlm = fake('[]')
    const complete = await invoke({ action: 'extract', scope: 'all' }, completeLlm)
    assert.deepEqual(complete.source, { scope: 'all', analyzedChapters: 2, availableChapters: 3, truncated: false })
    assert.ok(completeLlm.calls[0].messages[0].content[0].text.indexOf('林舟是个沉默的少年') < completeLlm.calls[0].messages[0].content[0].text.indexOf('明天见'))
    const limited = fake('[]')
    const budget = await invoke({ novelId: 4, action: 'extract', scope: 'all' }, limited)
    assert.deepEqual(budget.source, { scope: 'all', analyzedChapters: 4, availableChapters: 6, truncated: true })
    const budgetPrompt = limited.calls[0].messages[0].content[0].text
    for (let index = 0; index < 4; index += 1) assert.equal(budgetPrompt.split(String.fromCharCode(0x7532 + index)).length - 1, 6000)
    assert.ok(budgetPrompt.length < 27000)
    assert.match(budgetPrompt, /截断/)
    assert.equal((await invoke({ novelId: 5, action: 'extract', scope: 'all' }, fake('[]'))).source.analyzedChapters, 15)
    assert.equal((await invoke({ novelId: 5, action: 'extract', scope: 'all', maxChapters: 100 }, fake('[]'))).source.analyzedChapters, 50)
  })
  await check('只预览：只读库中的人物、章节正文、修订与 rev 全部不变', async () => {
    assert.deepEqual(store.characters(1), before.characters)
    assert.deepEqual(store.chapters(1).map(row => store.chapter(row.id)), before.chapters)
    assert.equal(store.rev, before.rev)
    const audit = new DatabaseSync(initialized.dbPath, { readOnly: true })
    handles.push(audit)
    assert.equal(audit.prepare('SELECT COUNT(*) AS count FROM characters').get().count, 1)
    assert.equal(audit.prepare('SELECT COUNT(*) AS count FROM chapter_revisions').get().count, 0)
    audit.close()
    handles.pop()
  })
  console.log(`PASS: ${passed} character AI checks; synthetic temporary database and fake LLM only.`)
} finally {
  for (const handle of handles.reverse()) {
    if (typeof handle.dispose === 'function') handle.dispose()
    else handle.close()
  }
  // Resolve and verify both parent and ownership before recursively removing this fixture.
  assert.equal(path.dirname(ownedDirectory), fs.realpathSync(os.tmpdir()))
  assert.ok(path.basename(ownedDirectory).startsWith(prefix))
  assert.equal(fs.realpathSync(sandbox), ownedDirectory)
  assert.equal(fs.lstatSync(sandbox).isSymbolicLink(), false)
  fs.rmSync(ownedDirectory, { recursive: true, force: true })
}
