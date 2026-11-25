/**
 * 浏览器半边的真实渲染/纯逻辑自检。
 *
 * 用 esbuild 把 src/panel.jsx 编译成临时模块，再交给 react-dom/server 渲染。
 * 白屏类问题（渲染期抛错、hooks 顺序）在这里会直接变成自检失败，
 * 而不是等用户点开面板才发现。React 保持 external，与脚本共用同一份实例。
 */

import { build } from 'esbuild'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { rm } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
let cached = null

/** 编译并加载一次 panel.jsx（同一进程内复用）。 */
export async function loadPanel() {
  if (cached) return cached
  const outfile = path.join(here, `.panel-render-${process.pid}.mjs`)
  await build({
    entryPoints: [path.join(here, '..', 'src', 'panel.jsx')],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    external: ['react'],
    legalComments: 'none',
    logLevel: 'silent',
  })
  try {
    cached = await import(pathToFileURL(outfile).href)
  } finally {
    await rm(outfile, { force: true })
  }
  return cached
}

const PROPS = {
  call: async () => ({}),
  novelId: 1,
  chapterId: 1,
  draft: '正文内容',
  selection: null,
  initialMode: null,
  writable: true,
  info: {
    available: true,
    model: 'render-check',
     models: [{ key: 'fixture/render-check', label: 'Fixture · Render check', provider: 'fixture', model: 'render-check' }, { key: 'fixture/other-model', label: 'Fixture · Other model', provider: 'fixture', model: 'other-model' }],
    modes: [
      { id: 'draft', label: '细纲写章', group: 'chapter' },
      { id: 'polish', label: '润色全章', group: 'chapter' },
      { id: 'polish-selection', label: '润色', group: 'selection' },
      { id: 'review', label: '审查', group: 'report' },
      { id: 'suggest', label: '创作顾问', group: 'report', saveAsOutline: false },
    ],
  },
  hasOutline: false,
  t: key => key,
  notify: () => {},
  onApply: () => {},
  onClose: () => {},
}

/** 渲染 AI 抽屉，返回 HTML。 */
export async function renderAiDrawer(overrides = {}) {
  const module = await loadPanel()
  if (typeof module.AiDrawer !== 'function') throw new Error('panel.jsx 未导出 AiDrawer')
  return renderToStaticMarkup(React.createElement(module.AiDrawer, { ...PROPS, ...overrides }))
}

/** 细纲锚点规则：只匹配当前章、自定义 marker 优先、未写到的标为待写。 */
export async function checkOutlineAnchors() {
  const module = await loadPanel()
  if (typeof module.matchOutlineAnchors !== 'function') throw new Error('panel.jsx 未导出 matchOutlineAnchors')
  const draft = '开场白。少年入城，风起。'
  const rows = [
    { id: 1, title: '少年入城', chapterId: 7 },
    { id: 2, title: '从未出现', chapterId: 7 },
    { id: 3, title: '少年入城', chapterId: 8 },
  ]
  const list = module.matchOutlineAnchors(draft, rows, { 2: '幕后黑手' }, 7)
  if (list.length !== 2) throw new Error(`应只匹配当前章，实际 ${list.length} 项`)
  if (!list[0].done || list[0].pos !== 4) throw new Error('标题前 8 字应命中正文')
  if (list[1].done) throw new Error('正文里没出现的锚点应标为待写')
  const custom = module.matchOutlineAnchors(draft, rows, { 1: '风起' }, 7)
  if (custom[0].marker !== '风起' || custom[0].pos !== draft.indexOf('风起')) {
    throw new Error('自定义 marker 应优先于标题')
  }
  const none = module.matchOutlineAnchors(draft, rows, {}, null)
  if (none.length !== 0) throw new Error('没有当前章节时不应返回锚点')
  return true
}

/** 撤销历史规则：程序化改写整段回退、连续输入合并、停顿分段、可重做。 */
export async function checkUndoHistory() {
  const module = await loadPanel()
  const names = ['createHistory', 'pushHistory', 'pushTypingHistory', 'undoHistory', 'redoHistory']
  for (const name of names) {
    if (typeof module[name] !== 'function') throw new Error(`panel.jsx 未导出 ${name}`)
  }
  const { createHistory, pushHistory, pushTypingHistory, undoHistory, redoHistory } = module

  const programmatic = { ...createHistory(), lastText: 'A' }
  pushHistory(programmatic, 'A', 'B')
  if (undoHistory(programmatic, 'B') !== 'A') throw new Error('程序化改写应能撤销回改写前')
  if (redoHistory(programmatic, 'A') !== 'B') throw new Error('程序化改写应能重做')
  if (undoHistory(createHistory(), 'X') !== null) throw new Error('空历史应返回 null')

  const typing = { ...createHistory(), lastText: 'A' }
  pushTypingHistory(typing, 'A', 'AB', 1000)
  pushTypingHistory(typing, 'AB', 'ABC', 1200)
  if (undoHistory(typing, 'ABC') !== 'A') throw new Error('连续输入应合并为一次撤销')
  if (redoHistory(typing, 'A') !== 'ABC') throw new Error('连续输入应能整体重做')

  const paused = { ...createHistory(), lastText: 'A' }
  pushTypingHistory(paused, 'A', 'AB', 1000)
  pushTypingHistory(paused, 'AB', 'ABC', 2000)
  if (undoHistory(paused, 'ABC') !== 'AB') throw new Error('停顿后应另起一个撤销单元')
  return true
}

/** Data-location controls must remain usable even without any novel or chapter. */
export async function checkStorageForm() {
  const module = await loadPanel()
  if (typeof module.DataSettings !== 'function') throw new Error('panel.jsx 未导出 DataSettings')
  const info = {
    dataDir: 'D:\\dsh-qibi\\data', dbPath: 'D:\\dsh-qibi\\data\\novelforge.db',
    defaultDataDir: 'D:\\dsh-qibi\\data', exists: true, canSave: true, canPick: false,
    userId: null, users: [],
  }
  const render = initialSettings => renderToStaticMarkup(React.createElement(module.DataSettings, {
    call: async () => ({}), t: key => key, initialSettings, onSaved: () => {},
  }))
  const html = render(info)
  for (const marker of ['for="qibi-data-directory"', 'id="qibi-data-directory"', 'D:\\dsh-qibi\\data', 'dataSettingsCreate', 'dataSettingsExisting', 'dataSettingsSave']) {
    if (!html.includes(marker)) throw new Error(`数据位置表单缺少可操作项：${marker}`)
  }
  if (html.includes('dataSettingsBrowse')) throw new Error('没有目录选择器时不应显示无效浏览按钮')
  const readonly = render({ ...info, canSave: false, reason: 'fixture: unavailable editor' })
  if (!readonly.includes('fixture: unavailable editor')) throw new Error('没有保存服务时必须显示原因')
  if (!/<button\b[^>]*disabled=""[^>]*>dataSettingsSave<\/button>/.test(readonly)) throw new Error('没有保存服务时必须禁用保存按钮')
  const picker = render({ ...info, canPick: true })
  if (!picker.includes('dataSettingsBrowse')) throw new Error('有目录选择器时应有浏览入口')
  const authorInfo = { ...info, users: [{ id: 7, username: 'fixture', disabled: false }] }
  const selected = module.dataSettingsPayload({ dataDir: info.dataDir, mode: 'existing', userId: '7' }, authorInfo)
  if (selected.userId !== 7) throw new Error('当前库有效作者应能被选择')
  const different = module.dataSettingsPayload({ dataDir: 'D:\\another-fixture', mode: 'existing', userId: '7' }, authorInfo)
  if ('userId' in different) throw new Error('换目录后重试不得携带旧库作者 ID')
  return true
}

/** Thinking controls must match capabilities rather than expose a hard-coded level list. */
export async function checkReasoningControls() {
  const module = await loadPanel()
  const info = {
    ...PROPS.info,
    model: 'fixture/writer-model',
    reasoning: {
      known: true, supported: true, selectedEffort: 'high', defaultEffort: 'low',
      efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }, { id: 'adaptive', name: 'Adaptive' }],
    },
  }
  const html = await renderAiDrawer({ info })
  const modelSelect = html.match(/<select\b[^>]*aria-label="aiGenerationModel"[^>]*>[\s\S]*?<\/select>/)?.[0]
  if (!modelSelect || !modelSelect.includes('fixture/render-check') || !modelSelect.includes('fixture/other-model')) throw new Error('模型目录必须渲染为可选项')
  const select = html.match(/<select\b[^>]*aria-label="aiReasoning"[^>]*>[\s\S]*?<\/select>/)?.[0]
  if (!select || select.includes('disabled=""')) throw new Error('模型支持思考档位时必须显示可用选择器')
  for (const value of ['low', 'high', 'adaptive']) {
    if (!select.includes(`value="${value}"`)) throw new Error(`缺少模型支持的思考档位：${value}`)
  }
  if (select.includes('value="medium"') || select.includes('value="max"')) throw new Error('界面不能虚构模型未支持的档位')
  if (!select.includes('aiReasoningFollow') || !select.includes('aiReasoningHigh')) throw new Error('必须能看到默认跟随及有效的当前强度')
  if (module.aiReasoningRequest(info, 'high').reasoningEffort !== 'high') throw new Error('手选强度必须进入写作请求')
  if (module.aiReasoningRequest(info, '').reasoningEffort !== '') throw new Error('默认项不得强制覆盖宿主强度')
  if (module.aiReasoningRequest(info, 'max').reasoningEffort !== '') throw new Error('过期偏好必须回到跟随模式')
  if (module.aiReasoningRequest(info, 'high').modelKey !== info.model) throw new Error('请求必须绑定界面显示的模型')
  for (const known of [true, false]) {
    const unsupported = await renderAiDrawer({ info: { ...info, reasoning: { known, supported: false, efforts: [] } } })
    const control = unsupported.match(/<select\b[^>]*aria-label="aiReasoning"[^>]*>/)?.[0]
    if (!control?.includes('disabled=""')) throw new Error('不能调整档位时选择器应禁用')
    if (!unsupported.includes(known ? 'aiReasoningUnsupported' : 'aiReasoningUnknown')) throw new Error('必须解释思考档位不可用的原因')
  }
  const loading = await renderAiDrawer({ info, modelLoading: true })
  if (!loading.includes('aiModelLoading') || !loading.includes('aria-busy="true"')) throw new Error('刷新能力期间必须有可见等待反馈')
  if (!/<button\b[^>]*disabled=""[^>]*>aiGenerate<\/button>/.test(loading)) throw new Error('刷新模型期间不应提交旧档位')
  return true
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const html = await renderAiDrawer()
    const required = ['qibi-ai-overlay', 'qibi-ai-drawer', 'qibi-ai-head', 'qibi-ai-close', 'qibi-presets', 'qibi-ai-note']
    const missing = required.filter(token => !html.includes(token))
    if (missing.length > 0) throw new Error(`缺少渲染标记：${missing.join(', ')}`)
    await checkOutlineAnchors()
    await checkUndoHistory()
    await checkStorageForm()
    await checkReasoningControls()
    console.log(`AI 抽屉渲染正常（${html.length} 字符）；思考档位、细纲锚点、撤销规则与数据位置表单正常`)
  } catch (error) {
    console.error(`浏览器半边自检失败：${error.message}`)
    process.exit(1)
  }
}
