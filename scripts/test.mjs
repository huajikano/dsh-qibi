#!/usr/bin/env node
/**
 * 回归测试运行器。
 *
 * 之前 test:release 是一条长 `&&` 链：第一个失败就中断，看不到其余结果，也没法单独跑一条。
 * 这里顺序执行全部检查、汇总通过与失败，并支持 --filter 只跑名字匹配的脚本。
 *
 * 用法：
 *   node scripts/test.mjs                 # 跑全部
 *   node scripts/test.mjs --filter qibi   # 只跑文件名含 qibi 的
 *   node scripts/test.mjs --bail          # 首个失败即停
 */
import { spawnSync } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const filterIndex = args.findIndex(arg => arg === '--filter' || arg.startsWith('--filter='))
const filter = filterIndex < 0
  ? ''
  : (args[filterIndex].includes('=') ? args[filterIndex].split('=')[1] : args[filterIndex + 1] ?? '')
const bail = args.includes('--bail')

// 明确列出参与发布的检查；未列出的脚本（如依赖本机真实库的 selftest）不会自动纳入。
const ORDER = [
  'database-check.mjs',
  'release-check.mjs',
  'storage-settings-check.mjs',
  'ai-reasoning-check.mjs',
  'history-check.mjs',
  'backup-restore-check.mjs',
  'daily-words-check.mjs',
  'character-ai-check.mjs',
  'character-flow-check.mjs',
  'character-ui-check.mjs',
  'theme-check.mjs',
  'density-check.mjs',
  'foreshadow-check.mjs',
  'distill-guide-check.mjs',
  'character-batch-check.mjs',
  'context-tool-check.mjs',
  'user-journey-check.mjs',
  'qa-regression-check.mjs',
  'novel-settings-check.mjs',
  'outline-workspace-check.mjs',
  'continuity-ai-check.mjs',
  'continuity-flow-check.mjs',
  'continuity-entry-check.mjs',
  'continuity-jobs-check.mjs',
  'version-info-check.mjs',
  'render-check.mjs',
]

const present = new Set((await readdir(here)).filter(name => name.endsWith('.mjs') && name !== 'test.mjs'))
const missing = ORDER.filter(name => !present.has(name))
if (missing.length > 0) {
  console.error(`[test] 清单里的脚本不存在：${missing.join(', ')}`)
  process.exit(1)
}
const unknown = [...present].filter(name => !ORDER.includes(name) && name !== 'selftest.mjs')
if (unknown.length > 0) {
  console.warn(`[test] 提示：这些脚本不在发布清单里，未执行：${unknown.sort().join(', ')}`)
}

const selected = ORDER.filter(name => !filter || name.includes(filter))
if (selected.length === 0) {
  console.error(`[test] 没有脚本匹配 --filter ${filter}`)
  process.exit(1)
}

const results = []
const startedAll = Date.now()
for (const name of selected) {
  const started = Date.now()
  process.stdout.write(`\n── ${name} ${'─'.repeat(Math.max(0, 58 - name.length))}\n`)
  const run = spawnSync(process.execPath, [path.join(here, name)], { stdio: 'inherit' })
  const ms = Date.now() - started
  const ok = run.status === 0
  results.push({ name, ok, ms, signal: run.signal ?? null })
  if (!ok && bail) break
}

const failed = results.filter(row => !row.ok)
const total = results.reduce((sum, row) => sum + row.ms, 0)
console.log(`\n${'='.repeat(64)}`)
for (const row of results) {
  console.log(`${row.ok ? 'PASS' : 'FAIL'}  ${row.name.padEnd(30)} ${(row.ms / 1000).toFixed(1).padStart(6)}s`)
}
console.log(`\n${results.length - failed.length}/${results.length} 通过，用时 ${(total / 1000).toFixed(1)}s`)
if (failed.length > 0) {
  console.log(`失败：${failed.map(row => row.name).join(', ')}`)
  process.exit(1)
}
console.log(`全部通过（${((Date.now() - startedAll) / 1000).toFixed(1)}s）`)
