import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { QibiStore } from '../lib/store.js'
import { activate } from '../lib/host.js'

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-qibi-reasoning-'))
const cleanup = []
try {
  const fixture = new QibiStore({ dataDir: sandbox })
  const novel = fixture.createNovel({ title: '推理测试夹具' }).novel
  const chapter = fixture.createChapter({ novelId: novel.id, title: '夹具章节' }).chapter
  fixture.dispose()

  let model = 'fixture-a'
  let metadataFailure = false
  let reasoning = {
    efforts: [{ id: 'low', name: 'Low' }, { id: 'medium', name: 'Medium' }, { id: 'high', name: 'High' }],
    defaultEffort: 'low',
  }
  const calls = []
  const llm = {
    async resolveModelInfo(provider, id) {
      if (metadataFailure) throw new Error('fixture: capability unavailable')
      return { provider, id, name: id, reasoning }
    },
    async *stream(options) {
      calls.push(options)
      yield { type: 'text-delta', index: 0, text: '夹具输出' }
      yield { type: 'finish', reason: { kind: 'stop' } }
    },
  }
  const routes = []
  const ctx = {
    get(name) {
      if (name === 'llm') return llm
      if (name === 'agentDefaultModel') return { currentSelection: () => ({ provider: 'fixture', model, reasoningEffort: 'medium' }) }
      return undefined
    },
    effect(fn) { const off = fn(); if (typeof off === 'function') cleanup.push(off); return off },
    connection: { fetch: { register(route) { routes.push(route); return async () => {} } } },
    tools: { register() { return () => {} } },
    systemPrompt: { section() { return () => {} } },
  }
  await activate(ctx, { dataDir: sandbox, allowWrite: false })
  const api = routes.find(row => row.path === '/api/qibi')
  const ai = routes.find(row => row.path === '/api/qibi/ai')
  const request = (url, payload) => new Request(`http://localhost${url}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  const info = await (await api.fetch(request('/api/qibi', { endpoint: 'aiInfo' }))).json()
  assert.equal(info.value.reasoning.supported, true)
  assert.deepEqual(info.value.reasoning.efforts.map(row => row.id), ['low', 'medium', 'high'])
  assert.equal(info.value.reasoning.selectedEffort, 'medium')
  assert.equal(info.value.reasoning.defaultEffort, 'low')

  const generate = async extra => ai.fetch(request('/api/qibi/ai', {
    mode: 'polish-selection', novelId: novel.id, chapterId: chapter.id, content: '夹具原文', ...extra,
  }))
  const manual = await generate({ reasoningEffort: 'high', modelKey: 'fixture/fixture-a' })
  assert.equal(manual.status, 200)
  assert.ok((await manual.text()).includes('"type":"done"'))
  assert.equal(calls.at(-1).reasoningEffort, 'high')

  const follow = await generate({ reasoningEffort: '' })
  await follow.text()
  assert.equal(calls.at(-1).reasoningEffort, 'medium')
  const legacy = await generate({})
  await legacy.text()
  assert.equal(calls.at(-1).reasoningEffort, 'medium')
  const continued = await generate({ mode: 'continue', reasoningEffort: 'low' })
  await continued.text()
  assert.equal(calls.at(-1).reasoningEffort, 'low')

  let count = calls.length
  const invalid = await generate({ reasoningEffort: 'xhigh' })
  assert.equal(invalid.status, 400)
  assert.equal(calls.length, count)
  const invalidType = await generate({ reasoningEffort: 3 })
  assert.equal(invalidType.status, 400)
  assert.equal(calls.length, count)

  reasoning = undefined
  const unsupportedInfo = await (await api.fetch(request('/api/qibi', { endpoint: 'aiInfo' }))).json()
  assert.equal(unsupportedInfo.value.reasoning.supported, false)
  assert.deepEqual(unsupportedInfo.value.reasoning.efforts, [])
  const unsupported = await generate({ reasoningEffort: 'high' })
  assert.equal(unsupported.status, 400)
  assert.equal(calls.length, count)

  metadataFailure = true
  const unknownInfo = await (await api.fetch(request('/api/qibi', { endpoint: 'aiInfo' }))).json()
  assert.equal(unknownInfo.value.reasoning.known, false)
  assert.equal(unknownInfo.value.available, true)
  const unknown = await generate({ reasoningEffort: 'high' })
  assert.equal(unknown.status, 400)
  assert.equal(calls.length, count)

  metadataFailure = false
  model = 'fixture-b'
  const stale = await generate({ modelKey: 'fixture/fixture-a', reasoningEffort: 'high' })
  assert.equal(stale.status, 400)
  assert.equal((await stale.json()).error.code, 'AI_MODEL_CHANGED')
  assert.equal(calls.length, count)
  console.log('PASS: reasoning options follow exact model metadata; explicit and inherited values reach llm.stream; continuation preserves the choice; unsupported, invalid and stale-model requests never dispatch.')
} finally {
  for (const off of cleanup.reverse()) await off()
  assert.ok(path.resolve(sandbox).startsWith(path.resolve(os.tmpdir()) + path.sep))
  fs.rmSync(sandbox, { recursive: true, force: true })
}
