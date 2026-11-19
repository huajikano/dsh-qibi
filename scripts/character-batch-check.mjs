import assert from 'node:assert/strict'
import { generateCharacterCandidates } from '../lib/character-ai.js'

const rows = new Map()
const reads = []
const seed = (novelId, chapters) => rows.set(novelId, chapters.map(([id, content]) => Object.freeze({ id, novelId, title: `Fixture ${id}`, content })))
const marker = index => `${String(index).padStart(5, '0')}|`
const long = Array.from({ length: 2250 }, (_, index) => marker(index)).join('')
seed(1, [[40, '  \n'], [30, long], [20, 'b'.repeat(6000)], [10, 'c'.repeat(6000)], [5, 'd'.repeat(6000)], [6, 'e'.repeat(6000)], [7, 'Final paragraph!'], [8, '\t']])
seed(2, [[90, 'Foreign chapter']])
seed(3, [])
seed(4, [...Array.from({ length: 32 }, (_, index) => [100 + index, index % 2 === 0 ? `Short ${index}` : ' ']), [500, ' ']])
const store = {
  novels: () => [...rows.keys()].map(id => ({ id })),
  chapters: novelId => rows.get(novelId).map(row => ({ id: row.id, wordCount: 0 })),
  chapter(id) {
    reads.push(id)
    return [...rows.values()].flat().find(row => row.id === id)
  },
  characters() { throw Error('range must not read characters') },
  importCharacters() { throw Error('preview must not mutate characters') },
  saveChapter() { throw Error('preview must not mutate chapters') },
}
const prompts = []
function fake({ output = '[{"name":"Fixture character"}]', finish = 'stop', abort } = {}) {
  return { async *stream(options) {
    prompts.push(options.messages[0].content[0].text)
    yield { type: 'text-delta', text: output }
    abort?.abort()
    yield { type: 'finish', reason: { kind: finish } }
  } }
}
const range = { novelId: 1, action: 'extract', scope: 'range', startChapterId: 40, endChapterId: 8 }
function invoke(input, llm = fake(), signal) {
  return generateCharacterCandidates({ store, input: { ...range, ...input }, llm, signal, selection: { provider: 'fixture', model: 'fixture' } })
}
const code = expected => error => error?.code === expected
const inputCount = () => prompts.length
const readsBefore = reads.length
const before = JSON.stringify([...rows])
for (const [input, expected] of [
  [{ novelId: 99 }, 'NOVEL_NOT_FOUND'],
  [{ novelId: 3 }, 'EMPTY_CONTENT'],
  [{ startChapterId: 90 }, 'CHAPTER_NOT_FOUND'],
  [{ endChapterId: 90 }, 'CHAPTER_NOT_FOUND'],
  [{ startChapterId: 7, endChapterId: 30 }, 'BAD_ARGUMENT'],
  [{ startChapterId: 0 }, 'BAD_ARGUMENT'],
  [{ batchCursor: {} }, 'BAD_ARGUMENT'],
  [{ batchCursor: { chapterIndex: 8, offset: 0 } }, 'BAD_ARGUMENT'],
  [{ batchCursor: { chapterIndex: 0, offset: -1 } }, 'BAD_ARGUMENT'],
  [{ batchCursor: { chapterIndex: 0, offset: '0' } }, 'BAD_ARGUMENT'],
]) await assert.rejects(invoke(input), code(expected))
assert.equal(reads.length, readsBefore, 'reject foreign, reversed and structurally invalid cursors before reading')
assert.equal(inputCount(), 0)
await assert.rejects(invoke({ startChapterId: 40, endChapterId: 40 }), code('EMPTY_CONTENT'))
await assert.rejects(invoke({ batchCursor: { chapterIndex: 1, offset: long.length } }), code('BAD_ARGUMENT'))
await assert.rejects(invoke({ batchCursor: { chapterIndex: 0, offset: 1 } }), code('BAD_ARGUMENT'))
assert.equal(inputCount(), 0)
console.log('PASS: range authorization, order, empty input and cursor validation')

const first = await invoke({})
assert.deepEqual(first.source, { scope: 'range', analyzedChapters: 1, availableChapters: 8, truncated: true, nextCursor: { chapterIndex: 1, offset: 6000 }, done: false })
assert.ok(prompts[0].includes(long.slice(0, 6000)))
assert.ok(!prompts[0].includes(marker(1000)))
const secondRequest = { batchCursor: first.source.nextCursor }
const second = await invoke(secondRequest)
assert.deepEqual(second.source, { scope: 'range', analyzedChapters: 1, availableChapters: 8, truncated: true, nextCursor: { chapterIndex: 1, offset: 12000 }, done: false })
assert.ok(prompts[1].includes(long.slice(6000, 12000)))
assert.ok(!prompts[1].includes(marker(999)))
const third = await invoke({ batchCursor: second.source.nextCursor })
assert.deepEqual(third.source, { scope: 'range', analyzedChapters: 5, availableChapters: 8, truncated: true, nextCursor: { chapterIndex: 5, offset: 4500 }, done: false })
assert.ok(prompts[2].includes(long.slice(12000)))
assert.ok(!prompts[2].includes(marker(1999)))
assert.equal(prompts[2].match(/e{2,}/)?.[0].length, 4500)
const lastRequest = { batchCursor: third.source.nextCursor }
const last = await invoke(lastRequest)
assert.deepEqual(last.source, { scope: 'range', analyzedChapters: 2, availableChapters: 8, truncated: false, nextCursor: null, done: true })
assert.equal(prompts[3].match(/e{2,}/)?.[0].length, 1500)
assert.ok(prompts[3].includes('Final paragraph!'))
assert.equal(inputCount(), 4, 'one model call per successful batch')
console.log('PASS: long chapter and aggregate budget continue without gaps or repeats')

const shortRange = { novelId: 4, startChapterId: 100, endChapterId: 500 }
const limited = await invoke({ ...shortRange, maxChapters: 50 })
assert.equal(limited.source.analyzedChapters, 15)
assert.deepEqual(limited.source.nextCursor, { chapterIndex: 30, offset: 0 }, 'skip trailing blank chapters without charging an empty batch')
const tail = await invoke({ ...shortRange, batchCursor: limited.source.nextCursor })
assert.equal(tail.source.analyzedChapters, 1)
assert.equal(tail.source.done, true)
assert.equal(tail.source.nextCursor, null)
console.log('PASS: range caps non-empty fragments at 15 regardless of legacy override')

for (const [model, expected] of [
  [fake({ finish: 'error' }), 'LLM_ERROR'],
  [fake({ finish: 'max-tokens' }), 'MAX_TOKENS'],
  [fake({ output: '[{"name":' }), 'INVALID_CHARACTER_JSON'],
]) await assert.rejects(invoke(lastRequest, model), code(expected))
const controller = new AbortController()
await assert.rejects(invoke(lastRequest, fake({ abort: controller }), controller.signal), code('ABORTED'))
const retry = await invoke(lastRequest)
assert.equal(new Set(prompts.slice(-5)).size, 1, 'each failed/cancelled batch can retry the exact same cursor')
assert.deepEqual(retry, last)
assert.equal(JSON.stringify([...rows]), before)
console.log('PASS: failed, truncated or canceled batches publish no candidates or cursor, and never mutate fixture data')
