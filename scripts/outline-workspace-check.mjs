// Actual component callbacks, SSR, and deferred fake calls. No database, browser, or visual claims.
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const compiled = await build({
  entryPoints: [fileURLToPath(new URL('../src/OutlineWorkspace.jsx', import.meta.url))],
  bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'transform',
  jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment', external: ['react'],
  legalComments: 'none', logLevel: 'silent',
})
const source = compiled.outputFiles[0].text.replace(/from "react"/g, `from ${JSON.stringify(pathToFileURL(require.resolve('react')).href)}`)
const { default: OutlineWorkspace } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
const tick = () => new Promise(resolve => setImmediate(resolve))
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const t = key => key
const chapters = [{ id: 11, title: '第一章' }, { id: 12, title: '第二章' }]
const rows = () => [
  { id: 3, title: '第二章提纲', content: '远处钟声', chapterId: 12, token: 'c0' },
  { id: 1, title: '', content: '总纲保留正文', chapterId: null, token: 'm0' },
  { id: 2, title: '第一章提纲', content: '长'.repeat(230), chapterId: 11, token: 'a0' },
]
const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
let confirmations = [], acceptConfirm = true
// This confirms intent only; it does not impersonate a browser layout.
globalThis.window = { confirm: message => { confirmations.push(message); return acceptConfirm } }
let passed = 0

function mount(supplied = {}) {
  const slots = []; let cursor = 0, dirty = false, effects = [], tree
  const focusEvents = []
  const elements = new Map(['outline-title', 'outline-reader'].map(name => [name, { focus() { focusEvents.push(`focus:${name}`) }, scrollIntoView() { focusEvents.push(`scroll:${name}`) } }]))
  const props = { call: async () => ({ outline: rows() }), novelId: 1, chapters, chapterId: 11, writable: true, active: true, notify() {}, t, ...supplied }
  const same = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]))
  const dispatcher = {
    useState(initial) { const index = cursor++; if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[index].value, next => { const value = typeof next === 'function' ? next(slots[index].value) : next; if (!Object.is(value, slots[index].value)) { slots[index].value = value; dirty = true } }] },
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value } },
    useId() { return `fixture-outline-${cursor++}` },
    useMemo(fn, deps) { const index = cursor++; if (!same(deps, slots[index]?.deps)) slots[index] = { deps, value: fn() }; return slots[index].value },
    useCallback(fn, deps) { return this.useMemo(() => fn, deps) },
    useEffect(fn, deps) { const index = cursor++; if (!same(deps, slots[index]?.deps)) { effects.push({ index, fn }); slots[index] = { deps, cleanup: slots[index]?.cleanup } } },
  }
  const text = node => Array.isArray(node) ? node.map(text).join('') : node == null || typeof node === 'boolean' ? '' : typeof node === 'object' ? text(node.props?.children) : String(node)
  function* walk(node) { if (Array.isArray(node)) { for (const child of node) yield* walk(child) } else if (node && typeof node === 'object') { yield node; yield* walk(node.props?.children) } }
  const nodes = predicate => [...walk(tree)].filter(predicate)
  function sync() {
    for (let attempt = 0; attempt < 30; attempt++) {
      cursor = 0; dirty = false; effects = []
      const holder = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher
      const prior = holder.current; holder.current = dispatcher
      try { tree = OutlineWorkspace(props) } finally { holder.current = prior }
      for (const node of walk(tree)) if (node.ref && elements.has(node.props?.name)) node.ref.current = elements.get(node.props.name)
      const pending = effects
      for (const effect of pending) slots[effect.index].cleanup?.()
      for (const effect of pending) slots[effect.index].cleanup = effect.fn()
      if (!dirty) return
    }
    throw Error('State did not settle')
  }
  const settle = async () => { for (let count = 0; count < 5; count++) { sync(); await tick() } sync() }
  sync()
  return {
    props, sync, settle, nodes, focusEvents, text: () => text(tree),
    button: key => nodes(node => node.type === 'button' && text(node) === key)[0],
    field: name => nodes(node => ['input', 'select', 'textarea'].includes(node.type) && node.props.name === name)[0],
    action: (id, action) => nodes(node => node.type === 'article' && node.props['data-outline-id'] === id).flatMap(node => [...walk(node)]).find(node => node.type === 'button' && node.props['data-outline-action'] === action),
    cards: () => nodes(node => node.type === 'article' && node.props['data-outline-id'] != null),
    unmount() { for (const slot of slots) slot?.cleanup?.() },
  }
}
const change = (app, name, value) => { const field = app.field(name); assert.ok(field, `Missing field ${name}`); field.props.onChange({ target: { value } }); app.sync() }
const click = async (app, key) => { const button = app.button(key); assert.ok(button, `Missing button ${key}`); await button.props.onClick(); await app.settle() }
const act = async (app, id, action) => { const button = app.action(id, action); assert.ok(button, `Missing ${action} for ${id}`); await button.props.onClick(); await app.settle() }
async function check(name, run) { confirmations = []; acceptConfirm = true; await run(); passed++; console.log(`ok ${passed} - ${name}`) }

try {
  await check('SSR renders the actual component in both access modes', async () => {
    for (const writable of [true, false]) {
      const html = renderToStaticMarkup(React.createElement(OutlineWorkspace, { call: async () => ({ outline: [] }), novelId: 1, chapters, chapterId: 11, writable, active: true, notify() {}, t }))
      assert.match(html, /qibi-outline-workspace/)
      assert.match(html, /outlineWorkspaceHint/)
      assert.match(html, /outlineNewMaster/)
      assert.match(html, /outlineNewChapter/)
    }
  })
  await check('master/chapter grouping, precise filters, body search and bounded preview', async () => {
    const app = mount()
    try {
      await app.settle()
      assert.deepEqual(app.cards().map(node => node.props['data-outline-id']), [1, 2, 3])
      const previews = app.nodes(node => node.props?.className === 'qibi-outline-preview')
      assert.ok(previews.every(node => Array.from(node.props.children).length <= 180))
      change(app, 'outline-filter', 'master'); assert.deepEqual(app.cards().map(node => node.props['data-outline-id']), [1])
      change(app, 'outline-filter', 'current'); assert.deepEqual(app.cards().map(node => node.props['data-outline-id']), [2])
      change(app, 'outline-filter', 'chapter:12'); assert.deepEqual(app.cards().map(node => node.props['data-outline-id']), [3])
      change(app, 'outline-filter', 'all'); change(app, 'outline-search', '钟声'); assert.deepEqual(app.cards().map(node => node.props['data-outline-id']), [3])
      change(app, 'outline-search', ''); await act(app, 2, 'read')
      assert.equal(app.field('outline-reader').props.value, '长'.repeat(230))
      assert.equal(app.field('outline-reader').props.readOnly, true)
    } finally { app.unmount() }
  })
  await check('create targets current chapter by default and sends exact untrimmed API values', async () => {
    const calls = []
    const app = mount({ call: async (method, input) => { calls.push({ method, input }); return method === 'createOutline' ? { id: 20, outline: [...rows(), { id: 20, ...input, token: 'new' }] } : { outline: rows() } } })
    try {
      await app.settle(); await click(app, 'outlineNewChapter')
      assert.equal(app.field('outline-target').props.value, '11'); assert.ok(app.field('outline-content').props.rows >= 10)
      change(app, 'outline-title', '  本地标题  '); change(app, 'outline-content', '保留\n正文')
      app.props.chapterId = 12; await app.settle(); assert.equal(app.field('outline-target').props.value, '11')
      await click(app, 'save')
      assert.deepEqual(calls.find(row => row.method === 'createOutline').input, { novelId: 1, title: '  本地标题  ', content: '保留\n正文', chapterId: 11 })
      await click(app, 'outlineNewMaster'); assert.equal(app.field('outline-target').props.value, '')
    } finally { app.unmount() }
  })
  await check('inline validation allows historical empty titles and updates with the read token', async () => {
    let payload
    const app = mount({ call: async (method, input) => { if (method === 'updateOutline') { payload = input; return { outline: rows() } } return { outline: rows() } } })
    try {
      await app.settle(); await click(app, 'outlineNewMaster'); await click(app, 'save')
      assert.ok(app.nodes(node => node.props?.role === 'alert').some(node => node.props.children === 'outlineNeedsText'))
      change(app, 'outline-title', '  '); change(app, 'outline-content', '\t\n'); await click(app, 'save'); assert.equal(payload, undefined)
      await click(app, 'cancel'); await act(app, 1, 'edit'); assert.equal(app.field('outline-title').props.value, '')
      change(app, 'outline-content', '总纲新稿'); await click(app, 'save')
      assert.deepEqual(payload, { outlineId: 1, title: '', content: '总纲新稿', chapterId: null, expectedToken: 'm0' })
    } finally { app.unmount() }
  })
  await check('dirty navigation/cancel/Escape ask before discard; hide and current chapter changes preserve drafts', async () => {
    const app = mount()
    try {
      await app.settle(); await act(app, 2, 'edit'); change(app, 'outline-content', '本地未保存')
      acceptConfirm = false
      await act(app, 3, 'read'); await click(app, 'outlineNewMaster'); await click(app, 'cancel')
      assert.equal(app.field('outline-content').props.value, '本地未保存'); assert.equal(confirmations.length, 3)
      let prevented = 0, stopped = 0
      const form = app.nodes(node => node.type === 'form')[0]
      form.props.onKeyDown({ key: 'Escape', preventDefault() { prevented++ }, stopPropagation() { stopped++ } }); app.sync()
      assert.equal(prevented, 1); assert.equal(stopped, 1); assert.equal(app.field('outline-content').props.value, '本地未保存')
      app.props.active = false; app.props.chapterId = 12; await app.settle()
      assert.equal(app.field('outline-content').props.value, '本地未保存'); assert.equal(app.field('outline-target').props.value, '11')
      acceptConfirm = true; await click(app, 'cancel'); assert.equal(app.field('outline-content'), undefined)
    } finally { app.unmount() }
  })
  await check('conflict keeps local draft and old token until an explicitly confirmed reload', async () => {
    const updates = []; let remote = rows()
    const app = mount({ call: async (method, input) => { if (method === 'updateOutline') { updates.push(input); throw Object.assign(Error('remote changed'), { code: 'ENTITY_CONFLICT' }) } return { outline: remote } } })
    try {
      await app.settle(); await act(app, 2, 'edit'); change(app, 'outline-content', '保留冲突稿'); await click(app, 'save')
      assert.equal(app.field('outline-content').props.value, '保留冲突稿'); assert.match(app.text(), /outlineConflictHint/)
      remote = rows().map(row => row.id === 2 ? { ...row, content: '远端新稿', token: 'a1' } : row)
      await click(app, 'outlineRefresh'); await click(app, 'save'); assert.deepEqual(updates.map(row => row.expectedToken), ['a0', 'a0'])
      acceptConfirm = false; await click(app, 'outlineReloadDiscard'); assert.equal(app.field('outline-content').props.value, '保留冲突稿')
      acceptConfirm = true; await click(app, 'outlineReloadDiscard'); assert.equal(app.field('outline-content').props.value, '远端新稿')
      change(app, 'outline-content', '新基线稿'); await click(app, 'save'); assert.equal(updates.at(-1).expectedToken, 'a1')
      assert.ok(confirmations.includes('outlineReloadConfirm'))
    } finally { app.unmount() }
  })
  await check('synchronous busy lock blocks rapid duplicate create and all draft-changing controls', async () => {
    const gate = deferred(); let creates = 0
    const app = mount({ call: async method => { if (method === 'createOutline') { creates++; return gate.promise } return { outline: rows() } } })
    try {
      await app.settle(); await click(app, 'outlineNewChapter'); change(app, 'outline-content', '待保存')
      const save = app.button('save').props.onClick, newMaster = app.button('outlineNewMaster').props.onClick
      const first = save(); const duplicate = save(); newMaster(); app.sync()
      assert.equal(creates, 1)
      for (const node of app.nodes(node => ['input', 'select', 'textarea', 'button'].includes(node.type))) assert.equal(node.props.disabled, true, `Busy control ${node.props.name ?? node.props.children}`)
      gate.resolve({ id: 30, outline: [...rows(), { id: 30, chapterId: 11, title: '', content: '待保存', token: 'n1' }] })
      await Promise.all([first, duplicate]); await app.settle(); assert.equal(app.field('outline-content'), undefined)
      await save(); await app.settle(); assert.equal(creates, 1, 'A stale save callback cannot create again after success')
    } finally { app.unmount() }
  })
  await check('successful create uses returned outline even if the next list refresh fails', async () => {
    let creates = 0, lists = 0
    const app = mount({ call: async method => { if (method === 'outline') { if (++lists > 1) throw Error('synthetic refresh failure'); return { outline: rows() } } if (method === 'createOutline') { creates++; return { id: 31, outline: [...rows(), { id: 31, chapterId: null, title: '已保存', content: '', token: 'n2' }] } } throw Error(method) } })
    try {
      await app.settle(); await click(app, 'outlineNewMaster'); change(app, 'outline-title', '已保存'); const oldSave = app.button('save').props.onClick
      await oldSave(); await app.settle(); assert.ok(app.cards().some(node => node.props['data-outline-id'] === 31))
      await click(app, 'outlineRefresh'); assert.match(app.text(), /synthetic refresh failure/)
      assert.ok(app.cards().some(node => node.props['data-outline-id'] === 31)); await oldSave(); await app.settle(); assert.equal(creates, 1)
    } finally { app.unmount() }
  })
  await check('read-only can read/copy content and event handlers cannot write', async () => {
    let writes = 0
    const app = mount({ writable: false, call: async method => { if (method !== 'outline') writes++; return { outline: rows() } } })
    try {
      await app.settle(); await act(app, 2, 'read'); assert.equal(app.field('outline-reader').props.readOnly, true); assert.equal(app.field('outline-reader').props.disabled, false)
      await click(app, 'outlineNewChapter'); await act(app, 2, 'edit'); await act(app, 2, 'delete'); assert.equal(writes, 0); assert.equal(app.field('outline-content'), undefined)
      app.props.writable = true; await app.settle(); await act(app, 2, 'edit'); change(app, 'outline-content', '可复制草稿'); const save = app.button('save').props.onClick
      app.props.writable = false; await app.settle(); assert.equal(app.field('outline-content').props.readOnly, true); assert.equal(app.field('outline-content').props.disabled, false)
      await save(); await app.settle(); assert.equal(writes, 0)
    } finally { app.unmount() }
  })
  await check('form-only save shortcut stops outer editor keys and respects IME', async () => {
    let writes = 0
    const app = mount({ call: async method => { if (method === 'createOutline') { writes++; return { id: 40, outline: rows() } } return { outline: rows() } } })
    try {
      await app.settle(); await click(app, 'outlineNewMaster'); change(app, 'outline-content', '快捷键稿')
      const form = app.nodes(node => node.type === 'form')[0]; let stopped = 0, prevented = 0
      form.props.onKeyDown({ key: 'Enter', ctrlKey: true, isComposing: true, stopPropagation() { stopped++ }, preventDefault() { prevented++ } }); assert.equal(writes, 0)
      form.props.onKeyDown({ key: 's', ctrlKey: true, stopPropagation() { stopped++ }, preventDefault() { prevented++ } }); assert.equal(writes, 0)
      await form.props.onKeyDown({ key: 'Enter', metaKey: true, stopPropagation() { stopped++ }, preventDefault() { prevented++ } }); await app.settle()
      assert.equal(writes, 1); assert.equal(stopped, 3); assert.equal(prevented, 1)
    } finally { app.unmount() }
  })
  await check('delete has its own gated payload and keeps an unrelated local draft', async () => {
    const deletes = [], gate = deferred()
    const app = mount({ call: async (method, input) => { if (method === 'deleteOutline') { deletes.push(input); return gate.promise } return { outline: rows() } } })
    try {
      await app.settle(); await act(app, 2, 'edit'); change(app, 'outline-content', '仍在编辑')
      const remove = app.action(3, 'delete').props.onClick, first = remove(); const duplicate = remove(); app.sync(); assert.equal(deletes.length, 1)
      gate.resolve({ deleted: 3, outline: rows().filter(row => row.id !== 3) }); await Promise.all([first, duplicate]); await app.settle()
      assert.deepEqual(deletes, [{ outlineId: 3 }]); assert.equal(app.field('outline-content').props.value, '仍在编辑'); assert.equal(app.cards().length, 2)
    } finally { app.unmount() }
  })
  await check('newer same-novel list responses win and an in-flight list cannot undo a saved create', async () => {
    const first = deferred(), second = deferred(), third = deferred(); let lists = 0
    const savedRows = [...rows(), { id: 70, title: '保存返回条目', content: '', chapterId: null, token: 's' }]
    const app = mount({ call: async method => {
      if (method === 'outline') return [first, second, third][lists++].promise
      if (method === 'createOutline') return { id: 70, outline: savedRows }
      throw Error(method)
    } })
    try {
      const latest = app.button('outlineRefresh').props.onClick(); second.resolve({ outline: rows() }); await latest; await app.settle()
      first.reject(Error('stale list failure')); await app.settle(); assert.ok(!app.text().includes('stale list failure'))
      const beforeSave = app.button('outlineRefresh').props.onClick(); await click(app, 'outlineNewMaster'); change(app, 'outline-title', '保存返回条目'); await click(app, 'save')
      third.resolve({ outline: [] }); await beforeSave; await app.settle(); assert.ok(app.cards().some(node => node.props['data-outline-id'] === 70))
    } finally { app.unmount() }
  })
  await check('registered leave guard reads latest busy/dirty state and never discards a draft itself', async () => {
    let guard, disposed = 0
    const gate = deferred()
    const registerGuard = next => { guard = next; return () => { disposed++ } }
    const app = mount({ registerGuard, call: async method => method === 'createOutline' ? gate.promise : { outline: rows() } })
    try {
      await app.settle(); assert.equal(guard(), true)
      await click(app, 'outlineNewMaster'); change(app, 'outline-title', '转场草稿')
      acceptConfirm = false; assert.equal(guard(), false); assert.equal(confirmations.at(-1), 'outlineDiscardChanges')
      app.props.active = false; await app.settle(); assert.equal(guard(), false, 'Hidden drafts must still participate in leaving guards')
      acceptConfirm = true; assert.equal(guard(), true); assert.equal(app.field('outline-title').props.value, '转场草稿')
      const saving = app.button('save').props.onClick(); assert.equal(guard(), false, 'Busy is guarded synchronously before a render')
      gate.resolve({ id: 60, outline: rows() }); await saving; await app.settle(); assert.equal(guard(), true)
      const staleGuard = guard; app.props.novelId = 2; await app.settle(); assert.equal(staleGuard(), true); assert.equal(disposed, 1)
    } finally { app.unmount() }
    assert.equal(disposed, 2)
  })
  await check('old novel list/save responses and finally cannot overwrite or unlock the new novel', async () => {
    const oldList = deferred(), newList = deferred(), oldSave = deferred(), newSave = deferred(); let phase = 'list'
    const app = mount({ call: async (method, input) => {
      if (method === 'outline') return phase === 'list' ? (input.novelId === 1 ? oldList.promise : newList.promise) : { outline: [] }
      if (method === 'createOutline') return input.novelId === 2 ? oldSave.promise : newSave.promise
      throw Error(method)
    } })
    try {
      app.props.novelId = 2; app.sync(); newList.resolve({ outline: [{ id: 50, title: 'B作品', content: '', chapterId: null, token: 'b' }] }); await app.settle()
      oldList.resolve({ outline: [{ id: 51, title: '迟到A作品', content: '', chapterId: null, token: 'a' }] }); await app.settle(); assert.ok(app.text().includes('B作品')); assert.ok(!app.text().includes('迟到A作品'))
      await click(app, 'outlineNewMaster'); change(app, 'outline-title', 'B待保存'); const first = app.button('save').props.onClick(); app.sync()
      phase = 'save'; app.props.novelId = 3; await app.settle(); await click(app, 'outlineNewMaster'); change(app, 'outline-title', 'C待保存'); const second = app.button('save').props.onClick(); app.sync()
      oldSave.resolve({ id: 52, outline: [{ id: 52, title: '迟到保存B', content: '', chapterId: null }] }); await first; await app.settle()
      assert.equal(app.field('outline-title').props.value, 'C待保存'); assert.equal(app.button('save').props.disabled, true); assert.ok(!app.text().includes('迟到保存B'))
      newSave.resolve({ id: 53, outline: [{ id: 53, title: 'C已保存', content: '', chapterId: null }] }); await second; await app.settle(); assert.ok(app.text().includes('C已保存'))
    } finally { app.unmount() }
  })
  await check('explicit read/edit/create request local focus and scrolling; list refresh never steals focus', async () => {
    const app = mount()
    try {
      await app.settle(); assert.deepEqual(app.focusEvents, [])
      await act(app, 2, 'read'); assert.deepEqual(app.focusEvents.slice(-2), ['focus:outline-reader', 'scroll:outline-reader'])
      await act(app, 2, 'edit'); assert.deepEqual(app.focusEvents.slice(-2), ['focus:outline-title', 'scroll:outline-title'])
      const count = app.focusEvents.length
      await click(app, 'outlineRefresh'); assert.equal(app.focusEvents.length, count)
      await click(app, 'outlineNewMaster'); assert.deepEqual(app.focusEvents.slice(-2), ['focus:outline-title', 'scroll:outline-title'])
    } finally { app.unmount() }
  })
  console.log(`PASS: ${passed} outline workspace checks; actual component SSR/events with isolated fake calls. Browser layout and real data were not accessed.`)
} finally {
  if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
  else delete globalThis.window
}
