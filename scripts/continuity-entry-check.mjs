// The actual entry component, rendered as data and invoked through its callbacks.
// No browser, database, model request, or visual verification.
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const compiled = await build({
  entryPoints: [fileURLToPath(new URL('../src/ContinuityOrganizer.jsx', import.meta.url))],
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'transform',
  jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment', external: ['react'],
  legalComments: 'none', logLevel: 'silent',
})
const source = compiled.outputFiles[0].text.replace(/from "react"/g, `from ${JSON.stringify(pathToFileURL(require.resolve('react')).href)}`)
const { default: ContinuityOrganizer } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
const t = key => ({
  continuityOrganizerFilled: 'Filled {n}',
  continuityOrganizerForeshadowAdded: 'Foreshadows {n}',
}[key] ?? key)
const chapter = { id: 11, title: '合成第一章' }
const defaults = {
  chapter, canOrganize: true, writable: true, enabled: false,
  onToggle() {}, onOrganize() {}, onCancel() {}, task: null, hasSummary: false, t,
}
const text = node => Array.isArray(node) ? node.map(text).join('') : node == null || typeof node === 'boolean' ? '' : typeof node === 'object' ? text(node.props?.children) : String(node)
function* walk(node) {
  if (Array.isArray(node)) { for (const child of node) yield* walk(child) }
  else if (node && typeof node === 'object') { yield node; yield* walk(node.props?.children) }
}
function mount(supplied = {}) {
  const slots = []; let cursor = 0, tree
  const props = { ...defaults, ...supplied }
  const dispatcher = {
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value } },
    useId() { return `fixture-continuity-${cursor++}` },
  }
  function sync() {
    cursor = 0
    const holder = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher
    const prior = holder.current; holder.current = dispatcher
    try { tree = ContinuityOrganizer(props) } finally { holder.current = prior }
  }
  sync()
  const nodes = predicate => [...walk(tree)].filter(predicate)
  return {
    props, sync, nodes, text: () => text(tree),
    button: key => nodes(node => node.type === 'button' && text(node) === key)[0],
    toggle: () => nodes(node => node.type === 'input' && node.props.type === 'checkbox')[0],
  }
}
let passed = 0
function check(name, run) { run(); passed++; console.log(`ok ${passed} - ${name}`) }

check('SSR supports every phase and access mode without a browser', () => {
  for (const writable of [true, false]) for (const phase of [null, 'running', 'done', 'error', 'cancelled']) {
    const task = phase && { phase, chapterId: 11, title: chapter.title, result: { filled: 2, foreshadowAdded: 1 }, message: phase === 'error' ? 'Synthetic model unavailable' : undefined }
    const html = renderToStaticMarkup(React.createElement(ContinuityOrganizer, { ...defaults, writable, task }))
    assert.match(html, /<section/)
    assert.match(html, /<header/)
    assert.match(html, /qibi-continuity-organizer/)
    assert.match(html, /<hr/)
    assert.match(html, /type="checkbox"/)
    assert.ok(!html.includes('<dialog'))
  }
})
check('chapter and body prerequisites explain disabled actions and guard callbacks', () => {
  for (const [supplied, key] of [
    [{ chapter: null, canOrganize: true }, 'continuityOrganizerSelectChapter'],
    [{ canOrganize: false }, 'continuityOrganizerNoBody'],
    [{ writable: false }, 'continuityOrganizerReadOnly'],
  ]) {
    let calls = 0
    const app = mount({ ...supplied, onOrganize: () => calls++ })
    const button = app.button('continuityOrganizerAction')
    assert.equal(button.props.disabled, true)
    button.props.onClick()
    assert.equal(calls, 0)
    assert.ok(app.text().includes(key))
  }
})
check('ready and existing-summary states stay distinct from task success', () => {
  const app = mount()
  assert.ok(app.text().includes('continuityOrganizerReady'))
  app.props.hasSummary = true; app.sync()
  assert.ok(app.text().includes('continuityOrganizerHasSummary'))
  assert.equal(app.button('continuityOrganizerAction').props.disabled, false)
})
check('a current enabled action invokes the parent callback', () => {
  let calls = 0
  const app = mount({ onOrganize: () => calls++ })
  app.button('continuityOrganizerAction').props.onClick()
  assert.equal(calls, 1)
})
check('running work for another chapter blocks a new request and remains cancellable', () => {
  let organized = 0, cancelled = 0
  const app = mount({
    task: { phase: 'running', chapterId: 12, title: '合成第二章任务' },
    onOrganize: () => organized++, onCancel: () => cancelled++,
  })
  assert.equal(app.button('continuityOrganizerAction').props.disabled, true)
  app.button('continuityOrganizerAction').props.onClick()
  app.button('continuityOrganizerCancel').props.onClick()
  assert.equal(organized, 0); assert.equal(cancelled, 1)
  assert.ok(app.text().includes(chapter.title) && app.text().includes('合成第二章任务'))
  const live = app.nodes(node => node.props?.['aria-live'] === 'polite')[0]
  assert.ok(live)
  assert.ok(text(live).includes('continuityOrganizerRunning'))
  app.props.writable = false; app.sync()
  assert.notEqual(app.button('continuityOrganizerCancel').props.disabled, true)
})
check('old action closures respect the latest disabled state and callback', () => {
  let oldCalls = 0, newCalls = 0
  const app = mount({ onOrganize: () => oldCalls++ })
  const oldStart = app.button('continuityOrganizerAction').props.onClick
  for (const change of [
    { writable: false },
    { writable: true, canOrganize: false },
    { canOrganize: true, chapter: null },
    { chapter, task: { phase: 'running', chapterId: 12, title: '合成任务' } },
  ]) { Object.assign(app.props, change); app.sync(); oldStart() }
  assert.equal(oldCalls, 0)
  Object.assign(app.props, { task: null, onOrganize: () => newCalls++ }); app.sync(); oldStart()
  assert.equal(newCalls, 1)
})
check('read-only auto toggle may turn off but cannot turn on, including old closures', () => {
  const values = []
  const app = mount({ onToggle: value => values.push(value) })
  const oldToggle = app.toggle().props.onChange
  oldToggle({ target: { checked: true } }); assert.deepEqual(values, [true])
  Object.assign(app.props, { writable: false, enabled: true }); app.sync()
  assert.equal(app.toggle().props.disabled, false)
  oldToggle({ target: { checked: false } }); assert.deepEqual(values, [true, false])
  app.props.enabled = false; app.sync()
  assert.equal(app.toggle().props.disabled, true)
  oldToggle({ target: { checked: true } }); assert.deepEqual(values, [true, false])
})
check('the checkbox remains controlled by the parent and names its operation', () => {
  const app = mount()
  assert.equal(app.toggle().props.checked, false)
  assert.equal(app.toggle().props.title, 'continuityOrganizerAutoTitle')
  assert.ok(app.text().includes('continuityOrganizerAuto'))
  app.props.enabled = true; app.sync(); assert.equal(app.toggle().props.checked, true)
})
check('completed work names its own chapter and shows exact result counts', () => {
  const app = mount({
    chapter: { id: 12, title: '合成当前章' },
    task: { phase: 'done', chapterId: 11, title: '合成已整理章', result: { filled: 2, foreshadowAdded: 3, alreadyOrganized: false, ledgerSkipped: true, ignoredExtra: 'not shown' } },
  })
  assert.ok(app.text().includes('合成当前章') && app.text().includes('合成已整理章'))
  assert.ok(app.text().includes('Filled 2') && app.text().includes('Foreshadows 3'))
  assert.ok(app.text().includes('continuityOrganizerLedgerSkipped'))
  assert.ok(!app.text().includes('not shown'))
  assert.equal(app.button('continuityOrganizerCancel'), undefined)
  app.props.task.result = { filled: 0, foreshadowAdded: 0, alreadyOrganized: true, ledgerSkipped: false }; app.sync()
  assert.ok(app.text().includes('continuityOrganizerAlreadyOrganized'))
  assert.ok(app.text().includes('Filled 0') && app.text().includes('Foreshadows 0'))
  assert.ok(!app.text().includes('continuityOrganizerLedgerSkipped'))
})
check('parent model failures are an alert and do not lose the task chapter', () => {
  const app = mount({ task: { phase: 'error', chapterId: 12, title: '合成报错章', message: 'Synthetic model unavailable' } })
  const alert = app.nodes(node => node.props?.role === 'alert')[0]
  assert.ok(alert)
  assert.ok(text(alert).includes('Synthetic model unavailable') && text(alert).includes('合成报错章'))
  assert.ok(app.text().includes('continuityOrganizerError'))
  assert.equal(app.button('continuityOrganizerAction').props.disabled, false)
})
check('cancelled tasks remain identifiable and obsolete cancel callbacks cannot fire', () => {
  let calls = 0
  const app = mount({ task: { phase: 'running', chapterId: 11, title: chapter.title }, onCancel: () => calls++ })
  const cancel = app.button('continuityOrganizerCancel').props.onClick
  app.props.task = { phase: 'cancelled', chapterId: 11, title: chapter.title }; app.sync(); cancel()
  assert.equal(calls, 0)
  assert.ok(app.text().includes('continuityOrganizerCancelled'))
})
check('long chapter titles are preserved as text and safely escaped by React', () => {
  const title = '长章名'.repeat(90) + '<script>synthetic</script>'
  const html = renderToStaticMarkup(React.createElement(ContinuityOrganizer, { ...defaults, chapter: { id: 11, title } }))
  assert.match(html, /&lt;script&gt;synthetic&lt;\/script&gt;/)
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('长章名'.repeat(90)))
})
console.log(`PASS: ${passed} continuity entry SSR/callback checks; no browser, manuscript, model, or generated artifact used.`)
