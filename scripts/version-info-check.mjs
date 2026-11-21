// 版本指纹检查：构建信息、后台回报与“未知接口”提示。
// 只用临时数据目录与假 ctx，不读真实书库、不调模型。
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { VERSION, BUILD } from '../src/build-info.js'
import { activate } from '../lib/host.js'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-qibi-version-'))
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const client = fs.readFileSync(new URL('../client.js', import.meta.url), 'utf8')

assert.equal(VERSION, pkg.version, 'build-info VERSION 必须与 package.json 一致')
assert.match(BUILD, /^[0-9a-f]{8}$/, 'BUILD 应为 8 位十六进制')
assert.ok(client.includes(`"${VERSION}"`) || client.includes(`'${VERSION}'`), 'client.js 应包含当前版本号')
assert.ok(client.includes(BUILD), 'client.js 应包含构建指纹')
assert.ok(!client.includes('build-info.js?rev'), '构建产物不应以带查询串的方式引用构建信息')

const routes = []
const cleanups = []
const ctx = {
  get() { return undefined },
  effect(fn) { const off = fn(); if (typeof off === 'function') cleanups.push(off); return off },
  connection: { fetch: { register(route) { routes.push(route); return async () => {} } } },
  tools: { register() { return () => {} } },
  systemPrompt: { section() { return () => {} } },
}
const call = async endpoint => {
  const route = routes.find(row => row.path === '/api/qibi')
  const request = new Request('http://fixture/api/qibi', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint, payload: {} }),
  })
  return (await route.fetch(request)).json()
}
try {
  await activate(ctx, { dataDir: root, allowWrite: false })
  const status = await call('status')
  assert.equal(status.ok, true, status.error?.message)
  assert.equal(status.value.pluginVersion, pkg.version, 'status 应回报后台版本')
  assert.ok(!Number.isNaN(Date.parse(status.value.hostStartedAt)), 'status 应回报可解析的启动时间')

  const unknown = await call('organizeContinuityFromTheFuture')
  assert.equal(unknown.ok, false)
  assert.equal(unknown.error.code, 'UNKNOWN_ENDPOINT')
  assert.match(unknown.error.message, /organizeContinuityFromTheFuture/)
  assert.equal(unknown.error.details.pluginVersion, pkg.version)
  assert.match(unknown.error.details.hint, /关闭「起笔」再重新启用|重启 DSH/)
  console.log('PASS: build version/fingerprint, host version reporting and the unknown-endpoint reload hint.')
} finally {
  for (const off of cleanups.reverse()) await off()
  assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep))
  fs.rmSync(root, { recursive: true, force: true })
}
