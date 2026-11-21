// qibi_context：一次取全上下文，且不越出当前作品。
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { activate } from '../lib/host.js'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-qibi-context-'))
const routes = []
const cleanups = []
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
try {
  await activate(ctx, { dataDir: root })
  const tool = tools.find(row => row.name === 'qibi_context')
  assert.ok(tool, '应注册 qibi_context')
  assert.deepEqual(tool.parameters.required, undefined, 'novelId 与 chapterId 都可省略')

  const novel = ok(await call('createNovel', { title: '上下文夹具', genre: '悬疑', intro: '简介夹具' })).novel
  const first = ok(await call('createChapter', { novelId: novel.id, title: '第一章 开端' })).chapter
  const second = ok(await call('createChapter', { novelId: novel.id, title: '第二章 转折' })).chapter
  ok(await call('save', { chapterId: first.id, content: '第一章正文：雨落在钟楼上。', expectedToken: first.token }))
  ok(await call('save', { chapterId: second.id, content: '第二章正文：钟声停了。', expectedToken: second.token }))
  ok(await call('createOutline', { novelId: novel.id, title: '总纲条目', content: '总纲：主角寻找失踪的钟表匠。' }))
  ok(await call('createOutline', { novelId: novel.id, chapterId: second.id, title: '第二章细纲', content: '细纲：钟声停止，主角进入塔内。' }))
  ok(await call('createCharacter', { novelId: novel.id, name: '沈砚', role: '主角', personality: '谨慎' }))
  ok(await call('updateChapterSummary', { chapterId: first.id, summary: '第一章摘要夹具' }))
  ok(await call('updateWriterState', { novelId: novel.id, progress: '进度夹具：写完第二章', foreshadowing: '[{"title":"铜钥匙","status":"open"}]' }))

  const secret = ok(await call('createNovel', { title: '另一部作品' })).novel
  ok(await call('createCharacter', { novelId: secret.id, name: '不该出现的角色' }))

  const full = await tool.execute({ novelId: novel.id, chapterId: second.id }, {})
  assert.match(full.context, /上下文夹具/)
  assert.match(full.context, /第一章 开端/)
  assert.match(full.context, /总纲：主角寻找失踪的钟表匠/)
  assert.match(full.context, /细纲：钟声停止/)
  assert.match(full.context, /沈砚/)
  assert.match(full.context, /进度夹具/)
  assert.match(full.context, /第一章摘要夹具/)
  assert.match(full.context, /第一章正文/)
  assert.ok(!full.context.includes('不该出现的角色'), '不能带出其他作品的人物')

  const single = await tool.execute({ novelId: novel.id, chapterId: first.id }, {})
  assert.match(single.context, /第一章 开端/)
  assert.ok(!single.context.includes('细纲：钟声停止'), '非当前章的细纲不应出现')

  ok(await call('select', { novelId: novel.id, chapterId: second.id }))
  const bySelection = await tool.execute({}, {})
  assert.match(bySelection.context, /细纲：钟声停止/, '省略参数时应使用面板选中章节')

  await assert.rejects(
    async () => tool.execute({ novelId: novel.id, chapterId: 999999 }, {}),
    /章节不存在|不存在/,
  )
  const foreign = ok(await call('createChapter', { novelId: secret.id, title: '别书章节' })).chapter
  await assert.rejects(
    async () => tool.execute({ novelId: novel.id, chapterId: foreign.id }, {}),
    /不属于这部作品/,
  )
  console.log(`PASS: qibi_context 返回完整且隔离的写作上下文（工具总数 ${tools.length}）。`)
} finally {
  for (const off of cleanups.reverse()) await off()
  assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep))
  fs.rmSync(root, { recursive: true, force: true })
}
