import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { QibiStore } from '../lib/store.js'
import { DatabaseSync } from 'node:sqlite'
import { activate } from '../lib/host.js'

const prefix = 'dsh-qibi-continuity-'
const temp = fs.realpathSync(os.tmpdir())
const dataDir = fs.mkdtempSync(path.join(temp, prefix))
const fixture = new QibiStore({ dataDir })
const routes = []
const cleanups = []
const modelCalls = []
const deferred = () => {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { resolve, promise }
}
const clue = '一盏蓝灯在门后彻夜亮着。'
const body = `雾落下来。${clue}年轻人没有打开门。`
const modelResult = { summary: '年轻人停在关着的门前。', keyEvents: '门后亮着一盏蓝灯。', cliffhanger: '年轻人没有打开门。', foreshadowing: [{ title: '蓝灯', detail: '门内无人应答，蓝灯持续亮着。', evidence: clue }, { title: '没打开的门', detail: '门一直关着。', evidence: '年轻人没有打开门。' }] }
let output = modelResult
let finish = 'stop'
let pause
let started
const llm = { async *stream(options) {
  modelCalls.push(options)
  started?.resolve()
  if (pause) await pause.promise
  yield { type: 'text-delta', text: JSON.stringify(output) }
  yield { type: 'finish', reason: { kind: finish } }
} }
const ctx = {
  get(key) {
    if (key === 'llm') return llm
    if (key === 'agentDefaultModel') return { currentSelection: () => ({ provider: 'fixture', model: 'fixture' }) }
  },
  effect(fn) { const off = fn(); if (typeof off === 'function') cleanups.push(off); return off },
  connection: { fetch: { register(route) { routes.push(route); return async () => {} } } },
  tools: { register() { return () => {} } },
  systemPrompt: { section() { return () => {} } },
}

async function call(endpoint, payload = {}, signal) {
  const route = routes.find(row => row.path === '/api/qibi')
  const request = new Request('http://fixture/api/qibi', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint, payload }), signal,
  })
  return (await route.fetch(request)).json()
}
function ok(result) { assert.equal(result.ok, true, result.error?.message); return result.value }
function fails(result, code) { assert.equal(result.ok, false); assert.equal(result.error.code, code, result.error.message) }
let passed = 0
async function check(name, test) { await test(); console.log(`ok ${++passed} - ${name}`) }

try {
  const novel = fixture.createNovel({ title: 'Fixture novel' }).novel
  const other = fixture.createNovel({ title: 'Foreign fixture novel' }).novel
  const chapterWithBody = (novelId, title, content = body) => {
    const created = fixture.createChapter({ novelId, title }).chapter
    return content ? fixture.saveChapter({ chapterId: created.id, content, expectedToken: created.token }).chapter : created
  }
  const organize = (chapter, options = {}, signal) => call('organizeContinuity', { novelId: chapter.novelId, chapterId: chapter.id, expectedChapterToken: chapter.token, ...options }, signal)
  const chapter = chapterWithBody(novel.id, 'Fixture first chapter')
  const otherChapter = chapterWithBody(other.id, 'Fixture other chapter')
  await activate(ctx, { dataDir })

  await check('saved prose only; fill blanks and append evidence without changing existing notes, chapter, or progress', async () => {
    const originalClue = { id: 'manual', title: '蓝灯', detail: 'Author note', status: 'resolved', extra: { keep: true } }
    fixture.upsertChapterSummary({ chapterId: chapter.id, summary: 'Original author summary' })
    fixture.updateWriterState({ novelId: novel.id, progress: 'Manual progress', foreshadowing: JSON.stringify([originalClue, 'Legacy note']) })
    const revisions = fixture.revisions(chapter.id)
    const result = ok(await organize(chapter, { content: 'Do not send this unsaved browser draft' }))
    assert.equal(result.filled, 2)
    assert.equal(result.foreshadowAdded, 1)
    assert.equal(result.ledgerSkipped, false)
    const summary = fixture.chapterSummary(chapter.id)
    assert.equal(summary.summary, 'Original author summary')
    assert.equal(summary.keyEvents, modelResult.keyEvents)
    assert.equal(summary.cliffhanger, modelResult.cliffhanger)
    const state = fixture.writerState(novel.id)
    assert.equal(state.progress, 'Manual progress')
    const ledger = JSON.parse(state.foreshadowing)
    assert.deepEqual(ledger.slice(0, 2), [originalClue, 'Legacy note'])
    assert.equal(ledger[2].title, '没打开的门')
    assert.equal(ledger[2].status, 'open')
    assert.equal(ledger[2].sourceChapterId, chapter.id)
    assert.ok(ledger[2].notes.includes('年轻人没有打开门。'))
    assert.deepEqual(fixture.chapter(chapter.id), chapter)
    assert.deepEqual(fixture.revisions(chapter.id), revisions)
    assert.equal(modelCalls.length, 1)
    const prompt = JSON.stringify(modelCalls[0].messages)
    assert.ok(prompt.includes(body))
    assert.ok(!prompt.includes('Do not send this unsaved browser draft') && !prompt.includes('Manual progress'))
  })

  await check('repeated successful organization does not call the model again in this host', async () => {
    const result = ok(await organize(chapter))
    assert.equal(result.alreadyOrganized, true)
    assert.equal(result.filled, 0)
    assert.equal(result.foreshadowAdded, 0)
    assert.equal(modelCalls.length, 1)
  })

  await check('reject unsaved versions, wrong ownership, disabled writing and nonpublished automatic targets before the model', async () => {
    fails(await organize(chapter, { expectedChapterToken: 'stale' }), 'CHAPTER_CONFLICT')
    fails(await organize(chapter, { novelId: other.id }), 'BAD_ARGUMENT')
    fails(await organize(otherChapter, { requirePublished: true }), 'CHAPTER_NOT_PUBLISHED')
    ok(await call('writable', { writable: false }))
    fails(await organize(otherChapter), 'WRITE_DISABLED')
    ok(await call('writable', { writable: true }))
    assert.equal(modelCalls.length, 1)
    assert.equal(fixture.chapterSummary(otherChapter.id).exists, false)
    const empty = chapterWithBody(novel.id, 'Empty fixture', '')
    fails(await organize(empty), 'EMPTY_CONTENT')
    assert.equal(modelCalls.length, 1)
  })

  await check('publication edge is reported by the status write; nothing runs on ordinary save or a repeated status', async () => {
    const updated = ok(await call('updateChapter', { chapterId: otherChapter.id, status: '已发布' }))
    assert.equal(updated.becamePublished, true)
    const unchanged = ok(await call('updateChapter', { chapterId: otherChapter.id, status: '已发布' }))
    assert.equal(unchanged.becamePublished, false)
    assert.equal(modelCalls.length, 1)
    assert.equal(fixture.chapterSummary(otherChapter.id).exists, false)
  })

  await check('an incompatible ledger is kept byte-for-byte while summary fields can still be saved', async () => {
    const raw = '{"legacy":{"x":9007199254740993}}'
    fixture.updateWriterState({ novelId: other.id, foreshadowing: raw })
    const result = ok(await organize(fixture.chapter(otherChapter.id), { requirePublished: true }))
    assert.equal(result.filled, 3)
    assert.equal(result.ledgerSkipped, true)
    assert.equal(result.foreshadowAdded, 0)
    assert.equal(fixture.writerState(other.id).foreshadowing, raw)
    assert.equal(fixture.chapterSummary(otherChapter.id).summary, modelResult.summary)
  })

  await check('reject a second active generation and do not write when notes changed while generating', async () => {
    const target = chapterWithBody(novel.id, 'Concurrent fixture')
    pause = deferred(); started = deferred()
    const running = organize(target)
    await started.promise
    try {
      fails(await organize(target), 'CONTINUITY_BUSY')
      fixture.upsertChapterSummary({ chapterId: target.id, summary: 'Externally saved while AI planned' })
    } finally { pause.resolve() }
    fails(await running, 'ENTITY_CONFLICT')
    pause = started = undefined
    const summary = fixture.chapterSummary(target.id)
    assert.equal(summary.summary, 'Externally saved while AI planned')
    assert.equal(summary.keyEvents, '')
  })

  await check('changed source or interrupted model output cannot save notes or retry automatically', async () => {
    const target = chapterWithBody(novel.id, 'Changed source fixture')
    pause = deferred(); started = deferred()
    const running = organize(target)
    await started.promise
    try { fixture.saveChapter({ chapterId: target.id, content: body + ' Another saved sentence.', expectedToken: target.token }) }
    finally { pause.resolve() }
    fails(await running, 'CHAPTER_CONFLICT')
    pause = started = undefined
    finish = 'max-tokens'
    fails(await organize(fixture.chapter(target.id)), 'MAX_TOKENS')
    finish = 'stop'
    assert.equal(fixture.chapterSummary(target.id).exists, false)
  })

  await check('request cancellation prevents writes and rollback does not leave half an update', async () => {
    const target = chapterWithBody(novel.id, 'Cancelled fixture')
    const controller = new AbortController()
    pause = deferred(); started = deferred()
    const running = organize(target, {}, controller.signal)
    await started.promise
    controller.abort()
    pause.resolve()
    fails(await running, 'ABORTED')
    pause = started = undefined
    assert.equal(fixture.chapterSummary(target.id).exists, false)
  })

  await check('a failed ledger write rolls the new chapter summary back in the same transaction', async () => {
    const target = chapterWithBody(novel.id, 'Atomic rollback fixture')
    const before = fixture.writerState(novel.id)
    const connection = new DatabaseSync(path.join(dataDir, 'novelforge.db'))
    connection.exec("CREATE TRIGGER fixture_continuity_fail BEFORE UPDATE OF foreshadowing ON novel_writer_state BEGIN SELECT RAISE(ABORT, 'fixture blocked ledger'); END")
    const savedOutput = output
    output = { ...modelResult, foreshadowing: [{ title: 'Unique rollback clue', detail: 'New only in fixture', evidence: clue }] }
    try {
      const result = await organize(target)
      assert.equal(result.ok, false)
      assert.ok(result.error.message.includes('fixture blocked ledger'))
      assert.equal(fixture.chapterSummary(target.id).exists, false)
      assert.deepEqual(fixture.writerState(novel.id), before)
    } finally { connection.exec('DROP TRIGGER fixture_continuity_fail'); connection.close(); output = savedOutput }
  })

  await check('a previously organized chapter can fill a manually cleared blank without overwriting the other notes', async () => {
    const notes = fixture.chapterSummary(chapter.id)
    fixture.upsertChapterSummary({ chapterId: chapter.id, keyEvents: '', expectedToken: notes.token })
    const before = modelCalls.length
    const result = ok(await organize(chapter))
    assert.equal(result.alreadyOrganized, false)
    assert.equal(result.filled, 1)
    assert.equal(modelCalls.length, before + 1)
    assert.equal(fixture.chapterSummary(chapter.id).summary, 'Original author summary')
    assert.equal(fixture.chapterSummary(chapter.id).keyEvents, modelResult.keyEvents)
  })

  await check('manual editors cannot overwrite a row that was absent when they loaded it', async () => {
    const target = chapterWithBody(novel.id, 'Absent-row conflict fixture')
    fixture.upsertChapterSummary({ chapterId: target.id, summary: 'Summary created by another writer' })
    fails(await call('updateChapterSummary', { chapterId: target.id, expectedAbsent: true, summary: 'Older empty snapshot' }), 'ENTITY_CONFLICT')
    fails(await call('updateWriterState', { novelId: novel.id, expectedAbsent: true, foreshadowing: '[]' }), 'ENTITY_CONFLICT')
    assert.equal(fixture.chapterSummary(target.id).summary, 'Summary created by another writer')
    assert.equal(fixture.writerState(novel.id).progress, 'Manual progress')
  })
  console.log(`PASS: ${passed} continuity flow checks (temporary database and fake model only).`)
} finally {
  pause?.resolve()
  for (const cleanup of cleanups.reverse()) await cleanup()
  fixture.dispose()
  const resolved = fs.realpathSync(dataDir)
  assert.equal(path.dirname(resolved), temp)
  assert.ok(path.basename(resolved).startsWith(prefix))
  fs.rmSync(resolved, { recursive: true, force: true })
}
