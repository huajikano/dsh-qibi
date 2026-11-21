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

import { readdir, readFile, writeFile, rm } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))

// 构建指纹：版本号来自 package.json，BUILD 取 src/ 全部源码的内容哈希。
// 面板页脚显示这两项，界面与后台版本不一致时能当场看出来。
const pkg = JSON.parse(await readFile(path.join(here, 'package.json'), 'utf8'))
const srcDir = path.join(here, 'src')
const sourceNames = (await readdir(srcDir))
  .filter(name => /\.(js|jsx)$/.test(name) && name !== 'build-info.js')
  .sort()
const digest = createHash('sha256')
for (const name of sourceNames) {
  digest.update(name)
  digest.update(await readFile(path.join(srcDir, name)))
}
const BUILD = digest.digest('hex').slice(0, 8)
// --check：只验证提交的 client.js 与 src/ 一致，不写任何文件，供 CI 与发布前检查使用。
const checkOnly = process.argv.includes('--check')
const buildInfoPath = path.join(srcDir, 'build-info.js')
const buildInfo = `// 由 build.mjs 生成，请勿手工修改。\nexport const VERSION = ${JSON.stringify(pkg.version)}\nexport const BUILD = ${JSON.stringify(BUILD)}\n`
if (!checkOnly) await writeFile(buildInfoPath, buildInfo, 'utf8')
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

if (checkOnly) {
  const { rm: remove } = await import('node:fs/promises')
  const problems = []
  let committedInfo = ''
  try { committedInfo = await readFile(buildInfoPath, 'utf8') } catch { problems.push('缺少 src/build-info.js（请先运行 node build.mjs）') }
  if (committedInfo && committedInfo !== buildInfo) problems.push('src/build-info.js 与 src/ 当前内容不一致')
  let committedClient = ''
  try { committedClient = await readFile(OUT, 'utf8') } catch { problems.push('缺少 client.js（请先运行 node build.mjs）') }
  if (committedClient && committedClient !== output) {
    const expected = output.split('\n')
    const actual = committedClient.split('\n')
    let line = 0
    while (line < Math.min(expected.length, actual.length) && expected[line] === actual[line]) line += 1
    problems.push(`client.js 与 src/ 重新构建的结果不同（首个差异在第 ${line + 1} 行，期望 ${expected.length} 行、现有 ${actual.length} 行）`)
  }
  await remove(path.join(here, '.build'), { recursive: true, force: true })
  if (problems.length > 0) {
    console.error('[dsh-qibi] 构建产物已过期：\n- ' + problems.join('\n- ') + '\n请运行 node build.mjs 后提交 client.js 与 src/build-info.js。')
    process.exit(1)
  }
  console.log(`[dsh-qibi] 构建产物一致：v${pkg.version} · ${BUILD}`)
  process.exit(0)
}

await writeFile(OUT, output, 'utf8')
await rm(path.join(here, '.build'), { recursive: true, force: true })
console.log(`[dsh-qibi] client.js 已生成：${OUT}（${(output.length / 1024).toFixed(1)} KB）`)
