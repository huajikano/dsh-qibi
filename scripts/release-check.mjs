import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { QibiStore, defaultDataDir } from '../lib/store.js'

// No developer manuscripts: all databases used by these checks live under this owned directory.
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-qibi-release-'))
const previous = process.env.QIBI_DATA_DIR
const handles = []
try {
  const windowsDefault = defaultDataDir({ platform: 'win32', hasDrive: drive => drive === 'D:\\' })
  assert.equal(windowsDefault, 'D:\\dsh-qibi\\data')
  const fallback = defaultDataDir({ platform: 'win32', env: { APPDATA: sandbox }, hasDrive: () => false })
  assert.equal(fallback, path.win32.join(sandbox, 'dsh-qibi', 'data'))

  const legacyDir = path.join(sandbox, 'legacy', 'desktop', 'data')
  fs.mkdirSync(legacyDir, { recursive: true })
  const legacyFile = path.join(legacyDir, 'novelforge.db')
  const marker = Buffer.from('synthetic legacy marker: never read, copy, or replace')
  fs.writeFileSync(legacyFile, marker)

  delete process.env.QIBI_DATA_DIR
  const freshDir = path.join(sandbox, 'new-default')
  const fresh = new QibiStore({}, { defaultDirectory: () => freshDir })
  handles.push(fresh)
  const status = fresh.status()
  assert.equal(status.error, null, status.error?.message)
  assert.equal(status.exists, true)
  assert.deepEqual(status.counts, { novels: 0, chapters: 0, words: 0 })
  assert.equal(status.user?.username, '本地作者')
  assert.deepEqual(fresh.novels(), [])
  assert.deepEqual(fs.readFileSync(legacyFile), marker)

  // All core writing operations work from a completely blank installation.
  const novel = fresh.createNovel({ title: '夹具作品' }).novel
  const chapter = fresh.createChapter({ novelId: novel.id, title: '夹具章节' }).chapter
  const saved = fresh.saveChapter({ chapterId: chapter.id, content: '仅用于自动化检查的文本。' })
  assert.ok(saved.chapter.wordCount > 0)
  assert.equal(fresh.status().counts.chapters, 1)

  const explicit = new QibiStore({ dataDir: path.join(sandbox, 'explicit') })
  handles.push(explicit)
  assert.equal(explicit.status().error, null)
  assert.deepEqual(explicit.novels(), [])

  process.env.QIBI_DATA_DIR = path.join(sandbox, 'env-explicit')
  const envExplicit = new QibiStore()
  handles.push(envExplicit)
  assert.equal(envExplicit.dataDir, process.env.QIBI_DATA_DIR)
  assert.equal(envExplicit.status().error, null)
  assert.deepEqual(envExplicit.novels(), [])

  const readonly = new QibiStore({ dataDir: path.join(sandbox, 'readonly-missing'), allowWrite: false })
  handles.push(readonly)
  assert.equal(readonly.status().error?.code, 'NO_DB')
  assert.equal(fs.existsSync(readonly.dbPath), false)
  console.log('PASS: Windows prefers D:, missing drives use isolated storage, fresh installs are empty and writable, legacy manuscripts stay untouched, and read-only never creates a database.')
} finally {
  for (const handle of handles) handle.dispose()
  if (previous === undefined) delete process.env.QIBI_DATA_DIR
  else process.env.QIBI_DATA_DIR = previous
  assert.ok(path.resolve(sandbox).startsWith(path.resolve(os.tmpdir()) + path.sep))
  fs.rmSync(sandbox, { recursive: true, force: true })
}
