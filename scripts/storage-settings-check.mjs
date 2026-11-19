import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { activate } from '../lib/host.js'

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-qibi-settings-'))
const active = []
const entry = { id: 'qibi' }
let persisted = { allowWrite: true, aiModel: 'keep-this', dataDir: path.join(sandbox, 'current') }
let edits = 0
let rejectSave = false
const editor = {
  async edit(target, change) {
    assert.equal(target, entry)
    if (rejectSave) throw new Error('fixture: persistence rejected')
    persisted = change({ ...persisted }, {})
    edits += 1
  },
}
async function boot(config = persisted, provideEditor = true) {
  const routes = []
  const tools = []
  const cleanup = []
  const ctx = {
    fiber: { entry },
    get: name => name === 'configEditor' && provideEditor ? editor : undefined,
    effect(fn) { const off = fn(); if (typeof off === 'function') cleanup.push(off); return off },
    tools: { register(tool) { tools.push(tool); return () => {} } },
    systemPrompt: { section() { return () => {} } },
    connection: { fetch: { register(route) { routes.push(route); return async () => {} } } },
  }
  await activate(ctx, config)
  const api = {
    tools,
    async call(endpoint, payload = {}) {
      const route = routes.find(row => row.path === '/api/qibi')
      const request = new Request('http://localhost/api/qibi', { method: 'POST', body: JSON.stringify({ endpoint, payload }), headers: { 'content-type': 'application/json' } })
      return (await route.fetch(request)).json()
    },
    async close() { for (const off of cleanup.reverse()) await off() },
  }
  active.push(api)
  return api
}
try {
  const app = await boot()
  const info = await app.call('dataSettings')
  assert.equal(info.ok, true)
  assert.equal(info.value.canSave, true)
  assert.equal(info.value.dataDir, persisted.dataDir)

  const dataDir = path.join(sandbox, 'chosen')
  const result = await app.call('saveDataSettings', { dataDir, mode: 'create' })
  assert.equal(result.ok, true, result.error?.message)
  assert.equal(result.value.saved, true)
  assert.equal(persisted.dataDir, dataDir)
  assert.equal(persisted.aiModel, 'keep-this')
  assert.equal(edits, 1)

  const restarted = await boot()
  const status = await restarted.call('status')
  assert.equal(status.value.dataDir, dataDir)
  assert.deepEqual(status.value.counts, { novels: 0, chapters: 0, words: 0 })
  assert.equal(status.value.error, null)
  const tool = restarted.tools.find(row => row.name === 'qibi_storage')
  assert.ok(tool)
  assert.equal((await tool.execute({ action: 'info' }, {})).dataDir, dataDir)

  // Both callers go through exactly the same operation, retaining other configuration fields.
  const viaTool = path.join(sandbox, 'chosen-via-tool')
  await tool.execute({ action: 'configure', dataDir: viaTool, mode: 'create' }, {})
  assert.equal(persisted.dataDir, viaTool)
  assert.equal(persisted.aiModel, 'keep-this')
  assert.equal(edits, 2)

  const duplicate = await restarted.call('saveDataSettings', { dataDir, mode: 'create' })
  assert.equal(duplicate.ok, false)
  assert.equal(edits, 2)
  const missing = await restarted.call('saveDataSettings', { dataDir: path.join(sandbox, 'missing'), mode: 'existing' })
  assert.equal(missing.ok, false)
  assert.equal(fs.existsSync(path.join(sandbox, 'missing')), false)
  const relative = await restarted.call('saveDataSettings', { dataDir: 'relative/path', mode: 'create' })
  assert.equal(relative.ok, false)

  rejectSave = true
  const rejected = await restarted.call('saveDataSettings', { dataDir, mode: 'existing' })
  assert.equal(rejected.ok, false)
  assert.equal(persisted.dataDir, viaTool)
  rejectSave = false
  const noEditor = await boot({ dataDir, allowWrite: true }, false)
  assert.equal((await noEditor.call('dataSettings')).value.canSave, false)
  assert.equal((await noEditor.call('saveDataSettings', { dataDir, mode: 'existing' })).ok, false)
  console.log('PASS: settings UI/API and tool persist through configEditor, survive restart, preserve other fields, refuse overwrites and invalid paths, and report persistence failures.')
} finally {
  for (const app of active.reverse()) await app.close()
  assert.ok(path.resolve(sandbox).startsWith(path.resolve(os.tmpdir()) + path.sep))
  fs.rmSync(sandbox, { recursive: true, force: true })
}
