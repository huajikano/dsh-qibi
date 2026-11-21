// 删除章节的备份：列出、恢复为新章节、拒绝路径越界与跨作者访问。
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { QibiStore } from '../lib/store.js'
import { activate } from '../lib/host.js'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-qibi-backup-'))
const stores = []
const cleanups = []
const routes = []
const tools = []
const ctx = {
  get() { return undefined },
  effect(fn) { const off = fn(); if (typeof off === 'function') cleanups.push(off); return off },
  connection: { fetch: { register(route) { routes.push(route); return async () => {} } } },
  tools: { register(tool) { tools.push(tool); return () => {} } },
  systemPrompt: { section() { return () => {} } },
}
const call = async (endpoint, payload = {}) => {
  const route = routes.find(row => row.path === '/api/qibi')
  const response = await route.fetch(new Request('http://fixture/api/qibi', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint, payload }),
  }))
  return response.json()
}
const ok = result => { assert.equal(result.ok, true, result.error?.message); return result.value }
const provider = () => { const store = new QibiStore({ dataDir: root }); stores.push(store); return store }
try {
  const seed = provider()
  const novel = seed.createNovel({ title: '备份夹具' }).novel
  const chapter = seed.createChapter({ novelId: novel.id, title: '第三章 雨中' }).chapter
  const content = '雨落在钟楼上。'.repeat(40)
  seed.saveChapter({ chapterId: chapter.id, content, expectedToken: chapter.token })
  const removed = seed.deleteChapter({ chapterId: chapter.id, confirm: true })
  assert.ok(removed.backupPath && fs.existsSync(removed.backupPath), '删除时应写备份文件')
  seed.dispose(); stores.pop()

  const app = provider()
  const backups = app.listChapterBackups(novel.id)
  assert.equal(backups.length, 1)
  assert.equal(backups[0].title, '第三章 雨中')
  assert.equal(backups[0].wordCount, content.length)
  assert.match(backups[0].file, /^chapter-\d+-\d+\.json$/)

  // 越界与伪造文件名必须拒绝
  for (const bad of ['../novelforge.db', 'chapter-1-1.json/../x', '..\\chapter-1-1.json', 'chapter-x-y.json']) {
    assert.throws(() => app.restoreChapterBackup({ file: bad }), error => ['BAD_ARGUMENT', 'BACKUP_INVALID'].includes(error.code))
  }
  app.dispose(); stores.pop()

  const restoredStore = provider()
  const restored = restoredStore.restoreChapterBackup({ file: backups[0].file })
  assert.equal(restored.chapter.title, '第三章 雨中')
  assert.equal(restored.chapter.content, content)
  assert.notEqual(restored.chapter.id, chapter.id, '恢复应新建章节而不是复用已删除的 id')
  assert.equal(restoredStore.listChapterBackups(novel.id).length, 1, '恢复后备份文件应保留')
  restoredStore.dispose(); stores.pop()

  await activate(ctx, { dataDir: root })
  const apiBackups = ok(await call('chapterBackups', { novelId: novel.id })).backups
  assert.equal(apiBackups.length, 1)
  const again = ok(await call('restoreChapterBackup', { file: apiBackups[0].file }))
  assert.equal(again.chapter.title, '第三章 雨中')
  const backupTool = tools.find(tool => tool.name === 'qibi_chapter')
  const viaTool = await backupTool.execute({ action: 'backups', novelId: novel.id }, {})
  assert.equal(viaTool.backups.length, 1)
  const toolRestore = await backupTool.execute({ action: 'restore_backup', file: viaTool.backups[0].file }, {})
  assert.equal(toolRestore.chapter.content, content)

  // 另一位作者看不到也恢复不了这份备份
  const { DatabaseSync } = await import('node:sqlite')
  const db = new DatabaseSync(path.join(root, 'novelforge.db'))
  db.prepare("INSERT OR IGNORE INTO users (id, username, password_hash, role, disabled) VALUES (2, '外部作者', '!FIXTURE!', 'author', 0)").run()
  db.close()
  const other = new QibiStore({ dataDir: root, userId: 2 })
  stores.push(other)
  assert.throws(() => other.listChapterBackups(novel.id), error => error.code === 'NOVEL_NOT_FOUND')
  assert.throws(() => other.restoreChapterBackup({ file: backups[0].file }), error => error.code === 'NOVEL_NOT_FOUND')
  other.dispose(); stores.pop()
  console.log('PASS: 备份列出/恢复、路径越界拒绝、跨作者拒绝、API 与工具共用同一服务。')
} finally {
  for (const off of cleanups.reverse()) await off()
  for (const store of stores.reverse()) { try { store.dispose() } catch { /* noop */ } }
  assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep))
  fs.rmSync(root, { recursive: true, force: true })
}
