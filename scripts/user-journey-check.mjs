import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { QibiStore } from '../lib/store.js'
import { activate } from '../lib/host.js'

const tmpBase = fs.realpathSync(os.tmpdir())
const prefix = 'dsh-qibi-user-journey-'
const root = fs.mkdtempSync(path.join(tmpBase, prefix))
const rootIdentity = fs.statSync(root, { bigint: true })
const handles = []
const disposers = []
const failures = []
let passed = 0

function check(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`ok ${passed} - ${name}`)
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
    console.error(`FAIL - ${name}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function checkAsync(name, fn) {
  try {
    await fn()
    passed += 1
    console.log(`ok ${passed} - ${name}`)
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
    console.error(`FAIL - ${name}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function expectError(fn, code) {
  assert.throws(fn, error => {
    if (code) assert.equal(error?.code, code, `${error?.code}: ${error?.message}`)
    assert.equal(typeof error?.message, 'string')
    return true
  })
}

async function expectAsyncError(fn, code) {
  await assert.rejects(fn, error => {
    if (code) assert.equal(error?.code, code, `${error?.code}: ${error?.message}`)
    assert.equal(typeof error?.message, 'string')
    return true
  })
}

function dbFor(dataDir, options = {}) {
  const db = new DatabaseSync(path.join(dataDir, 'novelforge.db'), options)
  handles.push(db)
  return db
}

function hostHarness(dataDir, config = {}) {
  const routes = []
  const tools = []
  const localDisposers = []
  const ctx = {
    get() { return undefined },
    effect(fn) {
      const off = fn()
      if (typeof off === 'function') localDisposers.push(off)
      return off
    },
    connection: { fetch: { register(route) { routes.push(route); return async () => {} } } },
    tools: { register(tool) { tools.push(tool); return () => {} } },
    systemPrompt: { section() { return () => {} } },
  }
  return activate(ctx, { dataDir, ...config }).then(() => ({
    routes,
    tools,
    async close() {
      for (const off of localDisposers.reverse()) await off()
    },
    async call(endpoint, payload = {}) {
      const route = routes.find(item => item.path === '/api/qibi')
      assert.ok(route, 'activate must register /api/qibi')
      const response = await route.fetch(new Request('http://fixture/api/qibi', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint, payload }),
      }))
      return response.json()
    },
  }))
}

try {
  const dataDir = path.join(root, 'library')
  const first = new QibiStore({ dataDir })
  handles.push(first)

  check('空库显式临时目录初始化且没有作品章节', () => {
    const status = first.status()
    assert.equal(status.error, null)
    assert.deepEqual(status.counts, { novels: 0, chapters: 0, words: 0 })
    assert.deepEqual(first.novels(), [])
    assert.equal(path.dirname(first.dbPath), dataDir)
    assert.ok(path.resolve(first.dbPath).startsWith(path.resolve(root)))
  })

  const novel = first.createNovel({ title: '合成旅程', author: '夹具作者', genre: '悬疑', intro: '临时简介' }).novel
  const chapter1 = first.createChapter({ novelId: novel.id, title: '开端' }).chapter
  const chapter2 = first.createChapter({ novelId: novel.id, title: '转折' }).chapter
  const chapter3 = first.createChapter({ novelId: novel.id, title: '结局' }).chapter
  first.saveChapter({ chapterId: chapter1.id, content: '钟楼里有一盏蓝灯，线索在这里。' })
  first.saveChapter({ chapterId: chapter2.id, content: '雨夜里有人敲门，转折发生。' })
  first.saveChapter({ chapterId: chapter3.id, content: '天亮后谜底揭开，结局收束。' })

  check('作品章节 CRUD 与初始排序', () => {
    assert.equal(first.novels().find(row => row.id === novel.id).chapterCount, 3)
    assert.deepEqual(first.chapters(novel.id).map(row => row.id), [chapter1.id, chapter2.id, chapter3.id])
    assert.deepEqual(first.chapters(novel.id).map(row => row.order), [1, 2, 3])
    const renamed = first.updateNovel({ novelId: novel.id, title: '合成旅程改名', intro: '改后简介' }).novel
    assert.equal(renamed.title, '合成旅程改名')
    assert.equal(renamed.intro, '改后简介')
    assert.equal(first.updateChapter({ chapterId: chapter1.id, title: '开端改', status: '已发布' }).chapter.title, '开端改')
  })

  check('移序后 sort_order 唯一且连续', () => {
    first.moveChapter({ chapterId: chapter2.id, direction: 'up' })
    first.moveChapter({ chapterId: chapter2.id, direction: 'down' })
    const db = dbFor(dataDir, { readOnly: true })
    const rows = db.prepare('SELECT id, sort_order FROM chapters WHERE novel_id = ? ORDER BY sort_order, id').all(novel.id)
    assert.deepEqual(rows.map(row => Number(row.sort_order)), [1, 2, 3])
    assert.equal(new Set(rows.map(row => Number(row.sort_order))).size, rows.length)
  })

  const current1 = first.chapter(chapter1.id)
  const firstBody = current1.content
  first.saveChapter({ chapterId: chapter1.id, content: `${firstBody}\n第二版内容。`, expectedToken: current1.token })
  const current2 = first.chapter(chapter1.id)
  first.saveChapter({ chapterId: chapter1.id, content: `${current2.content}\n第三版内容。`, expectedToken: current2.token })

  check('多章编辑生成修订并可恢复', () => {
    const revisions = first.revisions(chapter1.id)
    assert.ok(revisions.length >= 2)
    const oldest = revisions.at(-1)
    const restored = first.restoreRevision({ chapterId: chapter1.id, revisionId: oldest.id }).chapter
    assert.equal(restored.content, firstBody)
    assert.ok(first.revisions(chapter1.id).length >= revisions.length)
  })

  const deleteChapter = first.createChapter({ novelId: novel.id, title: '待删除' }).chapter
  first.saveChapter({ chapterId: deleteChapter.id, content: '删除前正文必须保留到备份。' })
  const deleteCurrent = first.chapter(deleteChapter.id)
  first.saveChapter({ chapterId: deleteChapter.id, content: `${deleteCurrent.content} 第二版。`, expectedToken: deleteCurrent.token })
  const deleteRevisionCount = first.revisions(deleteChapter.id).length
  const deleted = first.deleteChapter({ chapterId: deleteChapter.id, confirm: true })
  check('删章需要确认且正文备份可读取，修订无孤儿', () => {
    assert.ok(deleteRevisionCount > 0)
    assert.ok(deleted.backupPath && fs.existsSync(deleted.backupPath))
    const backup = JSON.parse(fs.readFileSync(deleted.backupPath, 'utf8'))
    assert.equal(backup.content, '删除前正文必须保留到备份。 第二版。')
    const db = dbFor(dataDir, { readOnly: true })
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM chapters WHERE id = ?').get(deleteChapter.id).n, 0)
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM chapter_revisions WHERE chapter_id = ?').get(deleteChapter.id).n, 0, '修订随章节级联清理，不遗留孤儿；正文已独立备份')
  })

  const outline = first.createOutline({ novelId: novel.id, title: '总纲线索', content: '蓝灯线索总纲' }).id
  const outlineChapter = first.createOutline({ novelId: novel.id, chapterId: chapter1.id, title: '本章细纲', content: '敲门人出现' }).id
  const character = first.createCharacter({ novelId: novel.id, name: '林舟', role: '主角', background: '守钟人背景' }).id
  first.updateCharacterState({ characterId: character, location: '钟楼', realm: '初阶', inventory: '旧钥匙', statusEffects: '疲惫', notes: '观察', keyRelationships: '与沈砚互信', recentEvents: '发现蓝灯' })
  first.upsertChapterSummary({ chapterId: chapter1.id, summary: '章摘要', keyEvents: '发现线索', cliffhanger: '门后有声' })
  first.updateWriterState({ novelId: novel.id, progress: '写到转折', foreshadowing: '[{"id":"lamp","open":true}]' })

  check('人物账本部分更新保留未传字段', () => {
    const before = first.characterState(character)
    const after = first.updateCharacterState({ characterId: character, location: '码头' })
    assert.equal(after.location, '码头')
    assert.equal(after.realm, before.realm)
    assert.equal(after.inventory, before.inventory)
    assert.equal(after.recentEvents, before.recentEvents)
  })

  check('章节摘要部分更新保留未传字段', () => {
    const before = first.chapterSummary(chapter1.id)
    const after = first.upsertChapterSummary({ chapterId: chapter1.id, summary: '摘要改' })
    assert.equal(after.summary, '摘要改')
    assert.equal(after.keyEvents, before.keyEvents)
    assert.equal(after.cliffhanger, before.cliffhanger)
  })

  check('写作状态部分更新保留伏笔且坏 JSON 被拒', () => {
    const before = first.writerState(novel.id)
    let rejected = false
    try {
      first.updateWriterState({ novelId: novel.id, foreshadowing: '{bad json' })
    } catch (error) {
      rejected = true
      assert.equal(error.code, 'BAD_ARGUMENT')
    }
    assert.equal(rejected, true, '坏伏笔 JSON 不应落库')
    const after = first.updateWriterState({ novelId: novel.id, progress: '继续写作' })
    assert.equal(after.progress, '继续写作')
    assert.equal(after.foreshadowing, before.foreshadowing)
    assert.doesNotThrow(() => JSON.parse(after.foreshadowing))
  })

  check('KB 重建覆盖章节/大纲/人物全部来源且可检索', () => {
    const stats = first.reindexNovel(novel.id)
    assert.ok(stats.chunks >= 3)
    const db = dbFor(dataDir, { readOnly: true })
    const kinds = db.prepare('SELECT DISTINCT source_kind AS kind FROM kb_chunks WHERE novel_id = ? ORDER BY kind').all(novel.id).map(row => row.kind)
    assert.deepEqual(kinds, ['chapter', 'character', 'outline'])
    assert.ok(first.kbQuery(novel.id, '蓝灯').some(hit => hit.kind === 'chapter' || hit.kind === 'outline'))
    assert.ok(first.kbQuery(novel.id, '守钟人').some(hit => hit.kind === 'character'))
    assert.ok(first.search('林舟', novel.id).characters.some(row => row.name === '林舟'))
  })

  check('标题改动同步更新 KB 分块标题', () => {
    first.updateChapter({ chapterId: chapter1.id, title: '开端索引新标题' })
    const hits = first.kbQuery(novel.id, '蓝灯')
    const chapterHit = hits.find(hit => hit.kind === 'chapter' && hit.sourceId === chapter1.id)
    assert.ok(chapterHit, '应找到第一章正文分块')
    assert.match(chapterHit.title, /开端索引新标题/)
  })

  check('Markdown/TXT 导出真的包含正文且只发布过滤有效', () => {
    const markdown = first.exportNovel({ novelId: novel.id, format: 'markdown' })
    const txt = first.exportNovel({ novelId: novel.id, format: 'txt' })
    assert.ok(markdown.content.includes('蓝灯'))
    assert.ok(txt.content.includes('蓝灯'))
    assert.equal(first.exportNovel({ novelId: novel.id, format: 'markdown', onlyPublished: true }).chapters, 1)
    assert.match(markdown.filename, /\.md$/)
    assert.match(txt.filename, /\.txt$/)
  })

  const author = first.createDistilledAuthor({ name: '合成文风', profile: { tone: '冷静' } })
  const material = [
    '第一章 开端', '蓝灯照在钟楼石阶。'.repeat(20),
    '第二章 转折', '雨夜有人敲门。'.repeat(20),
    '第三章 结局', '谜底在天亮时揭开。'.repeat(20),
  ].join('\n\n')
  const pasted = await first.addDistilledText({ authorId: author.id, filename: '合成材料.txt', text: material, kind: 'novel' })
  const uploadText = '第一章 上传\n\n上传素材正文。'.repeat(10)
  const upload = first.initDistilledSource({ authorId: author.id, filename: '分块.md', format: 'md', sizeBytes: Buffer.byteLength(uploadText) })
  first.appendDistilledSource({ sourceId: upload.sourceId, offset: 0, base64: Buffer.from(uploadText).toString('base64') })
  const completed = await first.completeDistilledSource({ sourceId: upload.sourceId })

  check('蒸馏素材粘贴与分块上传解析', () => {
    assert.ok(pasted.parsedChars > 0 && pasted.chapterCount >= 3)
    assert.equal(completed.status, 'ready')
    assert.ok(completed.parsedChars > 0)
    assert.equal(first.distilledAuthor(author.id).sources.length, 2)
  })

  const materialRead = await first.distilledMaterial(author.id)
  check('蒸馏 read 返回素材和提示词', () => {
    assert.match(materialRead.material, /合成材料|上传素材/)
    assert.ok(materialRead.prompts.writing.system)
    assert.ok(materialRead.prompts.persona.prompt)
    assert.ok(materialRead.prompts.merge.prompt)
  })
  const v1 = first.saveDistilledVersion({ authorId: author.id, writingSkill: '规则一', authorPersona: '画像一', skillMarkdown: '# Skill 一', sampleSummary: '摘要一' })
  const v2 = first.saveDistilledVersion({ authorId: author.id, writingSkill: '规则二', authorPersona: '画像二', skillMarkdown: '# Skill 二', sampleSummary: '摘要二' })
  check('蒸馏版本保存、绑定、回滚', () => {
    assert.equal(v1.version.version, 1)
    assert.equal(v2.version.version, 2)
    assert.equal(first.distilledVersions(author.id).length, 2)
    assert.equal(first.rollbackDistilledVersion({ authorId: author.id, versionId: v1.version.id }).currentVersionId, v1.version.id)
    assert.equal(first.bindDistilledAuthor({ authorId: author.id, novelId: novel.id }).writerState.distilledAuthorId, author.id)
    assert.equal(first.writerState(novel.id).distilledAuthorId, author.id)
  })

  check('只读与无效参数拒绝写入', () => {
    expectError(() => first.deleteNovel({ novelId: novel.id }), 'CONFIRM_REQUIRED')
    expectError(() => first.createChapter({ novelId: 0, title: '坏章' }), 'BAD_ARGUMENT')
    expectError(() => first.initDistilledSource({ authorId: author.id, filename: 'x.exe', format: 'exe', sizeBytes: 1 }), 'BAD_ARGUMENT')
    const offsetUpload = first.initDistilledSource({ authorId: author.id, filename: '偏移测试.txt', format: 'txt', sizeBytes: 3 })
    first.appendDistilledSource({ sourceId: offsetUpload.sourceId, offset: 0, base64: Buffer.from('abc').toString('base64') })
    expectError(() => first.appendDistilledSource({ sourceId: offsetUpload.sourceId, offset: 1, base64: Buffer.from('x').toString('base64') }), 'UPLOAD_OFFSET')
    const readonly = new QibiStore({ dataDir, allowWrite: false })
    handles.push(readonly)
    expectError(() => readonly.createNovel({ title: '只读不可写' }), 'READ_ONLY')
    expectError(() => readonly.saveChapter({ chapterId: chapter1.id, content: 'x' }), 'READ_ONLY')
    readonly.dispose()
  })

  const foreignDb = dbFor(dataDir)
  foreignDb.prepare("INSERT INTO users (id, username, password_hash, role, disabled) VALUES (2, '合成外部作者', '!FIXTURE!', 'author', 0)").run()
  foreignDb.prepare("INSERT INTO novels (id, user_id, title, intro) VALUES (900, 2, '外部秘密作品', '不应泄露')").run()
  foreignDb.prepare("INSERT INTO chapters (id, novel_id, title, content, sort_order) VALUES (901, 900, '外部章', '外部正文', 1)").run()
  foreignDb.close()
  handles.splice(handles.indexOf(foreignDb), 1)

  check('跨作者权限拒绝作品、章节与检索', () => {
    expectError(() => first.chapters(900), 'NOVEL_NOT_FOUND')
    const foreign = new QibiStore({ dataDir, userId: 2, allowWrite: false })
    handles.push(foreign)
    assert.deepEqual(foreign.novels().map(row => row.id), [900])
    expectError(() => foreign.chapter(chapter1.id), 'NOVEL_NOT_FOUND')
    foreign.dispose()
  })

  check('选中章节上下文不泄露他人作品或章节标题', () => {
    expectError(() => first.select({ novelId: 900, chapterId: 901 }), 'NOVEL_NOT_FOUND')
    assert.equal(first.selectionLine(), '', 'selectionLine 应校验当前作者和章节归属')
    first.select({ novelId: novel.id, chapterId: chapter1.id })
    assert.match(first.selectionLine(), /合成旅程改名/)
    assert.match(first.selectionLine(), /开端索引新标题/)
  })

  first.dispose()
  handles.splice(handles.indexOf(first), 1)

  const host = await hostHarness(dataDir)
  await checkAsync('activate 注册真实路由并可访问状态/导出', async () => {
    const status = await host.call('status')
    assert.equal(status.ok, true)
    assert.equal(status.value.counts.novels, 1)
    const exported = await host.call('export', { novelId: novel.id, format: 'txt' })
    assert.equal(exported.ok, true)
    assert.match(exported.value.content, /蓝灯/)
    const unknown = await host.call('not-an-endpoint')
    assert.equal(unknown.ok, false)
    assert.equal(unknown.error.code, 'UNKNOWN_ENDPOINT')
  })
  await host.close()

  console.log(`user-journey-check: ${passed} checks passed; ${failures.length} failures; temporary synthetic fixtures only.`)
  if (failures.length) {
    console.error('Failures:')
    for (const failure of failures) console.error(` - ${failure}`)
    process.exitCode = 1
  }
} finally {
  for (const handle of handles.reverse()) {
    try { handle.close?.() } catch { /* cleanup */ }
    try { handle.dispose?.() } catch { /* cleanup */ }
  }
  for (const off of disposers.reverse()) {
    try { await off() } catch { /* cleanup */ }
  }
  const absolute = path.resolve(root)
  assert.equal(path.dirname(absolute), tmpBase)
  assert.ok(path.basename(absolute).startsWith(prefix))
  assert.equal(fs.realpathSync(absolute), absolute)
  const current = fs.statSync(absolute, { bigint: true })
  assert.equal(current.dev, rootIdentity.dev)
  assert.equal(current.ino, rootIdentity.ino)
  fs.rmSync(absolute, { recursive: true, force: true })
}
