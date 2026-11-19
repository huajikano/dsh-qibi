import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { QibiStore, defaultDataDir } from '../lib/store.js'

// Release checks use a synthetic home directory and never open the developer's database.
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-qibi-release-'))
const previous = Object.fromEntries(['APPDATA', 'HOME', 'USERPROFILE', 'XDG_CONFIG_HOME', 'QIBI_DATA_DIR'].map(key => [key, process.env[key]]))
const handles = []
try {
  process.env.APPDATA = sandbox
  process.env.HOME = sandbox
  process.env.USERPROFILE = sandbox
  process.env.XDG_CONFIG_HOME = sandbox
  delete process.env.QIBI_DATA_DIR

  // Simulate an existing legacy database. The first-run guard must not even open it.
  const legacyDir = defaultDataDir()
  assert.ok(path.resolve(legacyDir).startsWith(path.resolve(sandbox)))
  fs.mkdirSync(legacyDir, { recursive: true })
  const legacyFile = path.join(legacyDir, 'novelforge.db')
  const marker = Buffer.from('synthetic legacy file: never open or change')
  fs.writeFileSync(legacyFile, marker)

  const fresh = new QibiStore()
  handles.push(fresh)
  assert.equal(fresh.status().error?.code, 'DATA_DIR_REQUIRED')
  assert.deepEqual(fresh.status().counts, { novels: 0, chapters: 0, words: 0 })
  assert.equal(fresh.status().user, null)
  assert.equal(fresh.db, null)
  assert.throws(() => fresh.novels(), { code: 'DATA_DIR_REQUIRED' })
  assert.deepEqual(fs.readFileSync(legacyFile), marker)

  const explicit = new QibiStore({ dataDir: path.join(sandbox, 'explicit') })
  handles.push(explicit)
  assert.equal(explicit.status().error?.code, 'NO_DB')

  process.env.QIBI_DATA_DIR = path.join(sandbox, 'env-explicit')
  const envExplicit = new QibiStore()
  handles.push(envExplicit)
  assert.equal(envExplicit.status().error?.code, 'NO_DB')
  console.log('PASS: first install never opens legacy manuscripts; explicit dataDir and QIBI_DATA_DIR remain supported.')
} finally {
  for (const handle of handles) handle.dispose()
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  assert.ok(path.resolve(sandbox).startsWith(path.resolve(os.tmpdir()) + path.sep))
  fs.rmSync(sandbox, { recursive: true, force: true })
}
