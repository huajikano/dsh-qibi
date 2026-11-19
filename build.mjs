/**
 * 把 src/ 编译成宿主可直接加载的 client.js。
 *
 * 宿主期望的产物形状是 `window.__ModuleLoader__.load({ id, factory(require) })`，
 * 而 esbuild 产出的是普通 CJS 模块，因此这里只做一件事：把 CJS 包体塞进 factory，
 * 由 factory 的 `require` 参数提供 React（宿主浏览器模块表里的同一份 React）。
 *
 * 注意：本构建**不**打包起笔的服务端与前端，也不存放任何起笔代码副本；
 * 插件只通过 `/api/qibi` 读取本机 `novelforge.db`，界面是 DSH 原生面板。
 *
 * 用法：node build.mjs
 */

import { readFile, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
// 必须与 package.json 的 name 一致：宿主用这个 id 注册工厂。
const ID = 'dsh-qibi'
const BODY = path.join(here, '.build', 'body.cjs')
const OUT = path.join(here, 'client.js')

const esbuild = await import('esbuild').catch(() => null)
if (esbuild === null) {
  console.error('[dsh-qibi] 需要 esbuild 才能构建浏览器半边：在仓库根目录 npm i 后重试。')
  process.exit(1)
}

await esbuild.build({
  entryPoints: [path.join(here, 'src', 'panel.jsx')],
  outfile: BODY,
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['chrome110'],
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  external: ['react'],
  legalComments: 'none',
  sourcemap: false,
  logLevel: 'warning',
})

const body = await readFile(BODY, 'utf8')
const indented = body.split('\n').map(line => (line.length > 0 ? `      ${line}` : line)).join('\n')
const output = `/* 由 build.mjs 生成，请勿手工修改；源码在 src/。 */
window.__ModuleLoader__.load({
  id: ${JSON.stringify(ID)},
  factory(require) {
    var module = { exports: {} }
    var exports = module.exports
${indented}
    return module.exports
  },
})
`

await writeFile(OUT, output, 'utf8')
await rm(path.join(here, '.build'), { recursive: true, force: true })
console.log(`[dsh-qibi] client.js 已生成：${OUT}（${(output.length / 1024).toFixed(1)} KB）`)
