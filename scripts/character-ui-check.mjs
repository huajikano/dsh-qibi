// Offline React 18 SSR + hook lifecycle checks. No server, model, database, or build output.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { transform } from 'esbuild'

const filename = fileURLToPath(new URL('../src/CharacterAiDialog.jsx', import.meta.url))
const require = createRequire(filename)
const source = await readFile(filename, 'utf8')
const compiled = await transform(source, { loader: 'jsx', format: 'cjs', target: 'es2022', sourcefile: filename })
const evaluated = { exports: {} }
new Function('require', 'module', 'exports', compiled.code)(require, evaluated, evaluated.exports)
const CharacterAiDialog = evaluated.exports.default
const t = key => key
const model = { available: true, model: 'fixture/model', reasoning: { known: true, supported: true, efforts: [{ id: 'low' }, { id: 'high' }], selectedEffort: 'low' } }
const fields = ['name', 'alias', 'role', 'gender', 'age', 'appearance', 'personality', 'background']
const chapters = { chapters: [{ id: 11, title: 'First', wordCount: 0, order: 0 }, { id: 8, title: 'Second', wordCount: 42, order: 1 }, { id: 6, title: 'Last', wordCount: 31, order: 2 }] }
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const tick = () => new Promise(resolve => setImmediate(resolve))
let assertions = 0
function check(value, message) { assert.ok(value, message); assertions++ }

const ssr = renderToStaticMarkup(React.createElement(CharacterAiDialog, { call: () => { throw Error('SSR must not call APIs') }, novelId: 7, chapterId: 8, characters: [], writable: true, t }))
check(ssr.includes('role="dialog"') && ssr.includes('aria-modal="true"'), 'SSR dialog semantics')
check(ssr.includes('aria-busy="true"') && ssr.includes('characterAiStartExtract'), 'SSR loading state')
check(ssr.includes('value="chapter" selected=""'), 'current chapter is the default scope')
const readOnlySsr = renderToStaticMarkup(React.createElement(CharacterAiDialog, { call: () => {}, novelId: 7, writable: false, initialAction: 'generate', t }))
check(readOnlySsr.includes('characterAiGenerateTitle') && readOnlySsr.includes('characterAiReadOnly') && readOnlySsr.includes('<textarea'), 'read-only generation has description input')

// This intentionally small hook runner exercises async closures and cleanup using
// React 18's dispatcher. It does not claim to test browser layout or rendering.
function mount(overrides = {}) {
  const slots = []
  let cursor = 0, dirty = false, pending = [], tree
  const listeners = new Map()
  const trigger = { isConnected: true, focus() { document.activeElement = trigger } }
  const controls = []
  const dialog = { focus() { document.activeElement = dialog }, querySelectorAll() { return controls } }
  globalThis.document = { activeElement: trigger, addEventListener(name, fn) { listeners.set(name, fn) }, removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name) } }
  const storage = new Map([['qibi:ai-reasoning', JSON.stringify({ 'fixture/model': 'high' })]])
  globalThis.localStorage = { getItem(key) { return storage.get(key) }, setItem(key, value) { storage.set(key, value) } }
  const props = { call: async () => model, novelId: 7, chapterId: 8, characters: [], writable: true, t, onClose() {}, onImported() {}, ...overrides }
  const call = props.call
  props.call = (...args) => args[0] === 'chapters' && !overrides.chapterFixture ? Promise.resolve(chapters) : call(...args)
  const dispatcher = {
    useState(initial) {
      const index = cursor++
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial }
      return [slots[index].value, update => { const next = typeof update === 'function' ? update(slots[index].value) : update; if (!Object.is(slots[index].value, next)) { slots[index].value = next; dirty = true } }]
    },
    useRef(initial) { const index = cursor++; if (!slots[index]) slots[index] = { current: initial }; return slots[index] },
    useId() { return `fixture-${cursor++}` },
    useEffect(effect, deps) {
      const index = cursor++
      const previous = slots[index]
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        slots[index] = { deps, cleanup: previous?.cleanup }
        pending.push({ index, effect })
      }
    },
  }
  function* walk(node) {
    if (!node || typeof node === 'boolean') return
    if (Array.isArray(node)) { for (const item of node) yield* walk(item); return }
    if (typeof node !== 'object') return
    if (typeof node.type === 'function') { yield* walk(node.type(node.props)); return }
    yield node
    yield* walk(node.props?.children)
  }
  const nodes = predicate => [...walk(tree)].filter(predicate)
  const text = node => Array.isArray(node) ? node.map(text).join('') : node == null || typeof node === 'boolean' ? '' : typeof node === 'object' ? typeof node.type === 'function' ? text(node.type(node.props)) : text(node.props?.children) : String(node)
  const button = key => nodes(node => node.type === 'button' && text(node) === key)[0]
  function render(runEffects = true) {
    dirty = false
    cursor = 0
    pending = []
    const internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
    const previous = internals.ReactCurrentDispatcher.current
    internals.ReactCurrentDispatcher.current = dispatcher
    try { tree = CharacterAiDialog(props) } finally { internals.ReactCurrentDispatcher.current = previous }
    for (const node of walk(tree)) if (node.ref && node.props?.role === 'dialog') node.ref.current = dialog
    if (runEffects) {
      const effects = pending
      for (const row of effects) slots[row.index].cleanup?.()
      for (const row of effects) slots[row.index].cleanup = row.effect()
    }
    return tree
  }
  function sync() { render(); for (let i = 0; dirty && i < 20; i++) render(); check(!dirty, 'hook updates settle') }
  async function settle() { sync(); await tick(); sync(); await tick(); sync() }
  function unmount() { for (const slot of slots) slot?.cleanup?.() }
  render()
  return { props, nodes, text: () => text(tree), button, render, sync, settle, unmount, listeners, trigger, controls, dialog, storage }
}

let requests = []
let imports = []
let closeCount = 0
let notified = []
let importGate = deferred()
let failImport = true
const fixture = mount({
  characters: [{ name: 'Already Here' }],
  call: async (method, input, options) => {
    requests.push({ method, input, signal: options?.signal })
    if (method === 'aiInfo') return model
    if (method === 'characterAi') return { characters: [{ name: 'Already Here', secret: 'discard' }, { name: 'New Name', background: 'Long fixture biography', secret: 'discard' }], source: { scope: 'chapter', analyzedChapters: 1, availableChapters: 4, truncated: true } }
    imports.push(input)
    if (failImport) throw Error('fixture import failure')
    return { created: 1, skipped: 0, characters: [{ name: 'New Name' }] }
  },
  onImported: result => { notified.push(result); return importGate.promise },
  onClose: () => closeCount++,
})
check(fixture.button('characterAiStartExtract').props.disabled, 'start disabled before model info resolves')
check(document.activeElement === fixture.dialog, 'dialog receives focus on entry')
await fixture.settle()
check(!fixture.button('characterAiStartExtract').props.disabled, 'start available after model metadata')
check(fixture.nodes(node => node.type === 'select' && node.props['aria-label'] === 'aiReasoning')[0].props.value === 'high', 'shares saved writing reasoning preference')
await fixture.button('characterAiStartExtract').props.onClick()
await fixture.settle()
const previewRequest = requests.find(row => row.method === 'characterAi')
check(previewRequest.input.modelKey === model.model && previewRequest.input.reasoningEffort === 'high' && previewRequest.input.chapterId === 8, 'request model, supported effort and chapter')
check(previewRequest.signal instanceof AbortSignal, 'preview passes AbortSignal')
let checkboxes = fixture.nodes(node => node.type === 'input' && node.props.type === 'checkbox')
check(!checkboxes[0].props.checked && checkboxes[1].props.checked, 'only new names selected by default')
check(fixture.text().includes('characterAiDuplicate') && fixture.text().includes('characterAiTruncated'), 'duplicate and truncated notices')
check(fixture.nodes(node => node.type === 'input' && node.props.className === 'qibi-input').length === 10 && fixture.nodes(node => node.type === 'textarea').length === 6, 'all eight fields are editable for two candidates')
const nameInput = fixture.nodes(node => node.type === 'input' && node.props.value === 'New Name')[0]
nameInput.props.onChange({ target: { value: '  ' } })
fixture.sync()
check(fixture.button('characterAiConfirmImport').props.disabled, 'blank selected name blocks import')
fixture.nodes(node => node.type === 'input' && node.props.value === '  ')[0].props.onChange({ target: { value: ' Edited Name ' } })
fixture.sync()
await fixture.button('characterAiConfirmImport').props.onClick()
await fixture.settle()
check(fixture.text().includes('fixture import failure') && fixture.nodes(node => node.type === 'fieldset').length === 2, 'import failure retains edited candidates')
check(Object.keys(imports[0].characters[0]).sort().join() === [...fields].sort().join() && imports[0].characters[0].name === 'Edited Name', 'import sends eight-field whitelist and edited trimmed name')
failImport = false
const importing = fixture.button('characterAiConfirmImport').props.onClick()
await fixture.settle()
check(notified.length === 1 && closeCount === 0, 'awaits onImported before close')
check(fixture.text().includes('characterAiCreated 1') && fixture.text().includes('characterAiSkipped 0'), 'created/skipped feedback visible while callback runs')
importGate.resolve()
await importing
check(closeCount === 0 && fixture.nodes(node => node.type === 'fieldset').length === 1 && fixture.text().includes('characterAiDuplicate'), 'successful import removes the selected character but preserves the unchecked duplicate')
fixture.unmount()
check(document.activeElement === fixture.trigger, 'returns focus to trigger on unmount')

const gate = deferred()
let abortedSignal
let raceClosed = 0
const race = mount({ call: async (method, input, options) => method === 'aiInfo' ? model : (abortedSignal = options.signal, gate.promise), onClose: () => raceClosed++ })
await race.settle()
const pendingPreview = race.button('characterAiStartExtract').props.onClick()
race.sync()
race.button('characterAiCancelRequest').props.onClick()
check(abortedSignal.aborted, 'cancel aborts request')
gate.resolve({ characters: [{ name: 'Late After Cancel' }] })
await pendingPreview
await race.settle()
check(!race.text().includes('Late After Cancel') && race.nodes(node => node.type === 'fieldset').length === 0, 'late response after cancel is ignored')
race.listeners.get('keydown')({ key: 'Escape', preventDefault() {}, stopPropagation() {} })
check(raceClosed === 1, 'Escape closes dialog')
race.unmount()

const old = deferred()
let oldSignal
let crossCallbacks = 0
const cross = mount({ call: async (method, input, options) => method === 'aiInfo' ? model : (oldSignal = options.signal, old.promise), onImported: () => crossCallbacks++ })
await cross.settle()
const oldRun = cross.button('characterAiStartExtract').props.onClick()
cross.props.novelId = 99
cross.sync()
check(oldSignal.aborted, 'changing novel aborts old request')
old.resolve({ characters: [{ name: 'Wrong Novel' }] })
await oldRun
await cross.settle()
check(cross.nodes(node => node.type === 'fieldset').length === 0 && crossCallbacks === 0, 'old novel results never populate or notify new novel')
cross.unmount()

let readonlyImports = 0
let readonlyPreview = null
const readonly = mount({ initialAction: 'generate', writable: false, chapterId: null, call: async (method, input) => {
  if (method === 'aiInfo') return { ...model, reasoning: { known: true, supported: false, efforts: [{ id: 'high' }] } }
  if (method === 'importCharacters') readonlyImports++
  readonlyPreview = input
  return { characters: [{ name: 'Read Only Preview' }] }
} })
await readonly.settle()
check(readonly.nodes(node => node.type === 'select' && node.props['aria-label'] === 'aiReasoning').length === 0, 'unsupported reasoning has no control')
check(readonly.button('characterAiStartGenerate').props.disabled, 'empty idea cannot start')
readonly.nodes(node => node.type === 'textarea')[0].props.onChange({ target: { value: ' A wandering fixture botanist ' } })
readonly.sync()
await readonly.button('characterAiStartGenerate').props.onClick()
await readonly.settle()
check(readonlyPreview.idea === 'A wandering fixture botanist' && !Object.hasOwn(readonlyPreview, 'reasoningEffort'), 'generation trims idea and omits unsupported effort')
check(readonly.button('characterAiConfirmImport').props.disabled, 'read-only import button disabled')
await readonly.button('characterAiConfirmImport').props.onClick()
check(readonlyImports === 0, 'read-only guard blocks import even if handler invoked')
readonly.unmount()

const loading = deferred()
let infoSignal
let loadingClosed = 0
const loadingFixture = mount({ call: (method, input, options) => { infoSignal = options.signal; return loading.promise }, onClose: () => loadingClosed++ })
await tick()
loadingFixture.nodes(node => node.type === 'button' && node.props['aria-label'] === 'close')[0].props.onClick()
check(infoSignal.aborted && loadingClosed === 1, 'close aborts pending model query')
loading.resolve(model)
await loadingFixture.settle()
check(loadingFixture.button('characterAiStartExtract').props.disabled, 'late model metadata cannot re-enable closed dialog')
loadingFixture.unmount()

const focusFixture = mount()
function focusControl() {
  const control = { getClientRects: () => [1], matches: () => false, getAttribute: () => null, focus() { document.activeElement = control } }
  return control
}
const first = focusControl(), last = focusControl()
focusFixture.controls.push(first, last)
let tabPrevented = false
const tab = shiftKey => { tabPrevented = false; focusFixture.listeners.get('keydown')({ key: 'Tab', shiftKey, preventDefault() { tabPrevented = true } }) }
last.focus()
tab(false)
check(document.activeElement === first && tabPrevented, 'Tab cycles from last to first control')
first.focus()
tab(true)
check(document.activeElement === last && tabPrevented, 'Shift+Tab cycles from first to last control')
focusFixture.unmount()

const closing = deferred()
let closingSignal
const closeFixture = mount({ call: (method, input, options) => method === 'aiInfo' ? model : (closingSignal = options.signal, closing.promise) })
await closeFixture.settle()
const closeRun = closeFixture.button('characterAiStartExtract').props.onClick()
closeFixture.nodes(node => node.type === 'button' && node.props['aria-label'] === 'close')[0].props.onClick()
check(closingSignal.aborted, 'close aborts active preview')
closing.resolve({ characters: [{ name: 'Late After Close' }] })
await closeRun
await closeFixture.settle()
check(closeFixture.nodes(node => node.type === 'fieldset').length === 0, 'closed dialog ignores late preview response')
closeFixture.unmount()

let infoAttempt = 0, previewAttempt = 0, allRequest
const retryFixture = mount({ chapterId: null, call: async (method, input) => {
  if (method === 'aiInfo') {
    if (infoAttempt++ === 0) throw Error('fixture metadata failure')
    return model
  }
  allRequest = input
  if (previewAttempt++ === 0) throw Error('fixture preview failure')
  return { characters: [], source: { scope: 'range', analyzedChapters: 3, availableChapters: 3, truncated: false, nextCursor: null, done: true } }
} })
await retryFixture.settle()
check(retryFixture.text().includes('fixture metadata failure') && retryFixture.button('characterAiStartExtract').props.disabled, 'metadata error prevents start and exposes retry')
retryFixture.button('retry').props.onClick()
await retryFixture.settle()
check(!retryFixture.button('characterAiStartExtract').props.disabled, 'metadata retry recovers')
await retryFixture.button('characterAiStartExtract').props.onClick()
await retryFixture.settle()
check(retryFixture.text().includes('fixture preview failure'), 'preview error remains retryable')
await retryFixture.button('characterAiStartExtract').props.onClick()
await retryFixture.settle()
check(allRequest.scope === 'range' && allRequest.startChapterId === 11 && allRequest.endChapterId === 6 && !Object.hasOwn(allRequest, 'chapterId'), 'without current chapter, whole-book analysis uses the ordered first and last chapter IDs')
check(retryFixture.text().includes('characterAiEmpty') && retryFixture.button('characterAiResetPreview') && !retryFixture.button('characterAiNextBatch'), 'empty final result offers restart, not automatic retry')
retryFixture.unmount()

const confirmedImport = deferred()
let confirmedSignal, confirmedCalls = 0, confirmedClose = 0, confirmedNotify = 0
const confirmed = mount({ call: (method, input, options) => {
  if (method === 'aiInfo') return model
  if (method === 'characterAi') return { characters: [{ name: 'Confirmed Fixture' }] }
  confirmedCalls++
  confirmedSignal = options.signal
  return confirmedImport.promise
}, onClose: () => confirmedClose++, onImported: () => confirmedNotify++ })
await confirmed.settle()
const confirmedPreview = confirmed.button('characterAiStartExtract').props.onClick()
confirmed.sync()
const staleCancel = confirmed.button('characterAiCancelRequest').props.onClick
await confirmedPreview
await confirmed.settle()
const staleClose = confirmed.nodes(node => node.type === 'button' && node.props['aria-label'] === 'close')[0].props.onClick
const confirmHandler = confirmed.button('characterAiConfirmImport').props.onClick
const confirmedRun = confirmHandler()
const duplicateRun = confirmHandler()
// Exercise stale handlers before React has rendered the importing state.
staleClose()
staleCancel()
confirmed.listeners.get('keydown')({ key: 'Escape', preventDefault() {}, stopPropagation() {} })
const mask = confirmed.nodes(node => node.props?.className === 'qibi-overlay qibi-character-ai-overlay')[0]
mask.props.onMouseDown({ target: mask, currentTarget: mask })
check(confirmedCalls === 1, 'ref lock prevents duplicate confirmed imports before rerender')
check(!confirmedSignal.aborted && confirmedClose === 0, 'pending import ignores stale cancel, close, Escape and mask without abort')
confirmed.sync()
check(confirmed.button('characterAiImporting').props.disabled && !confirmed.button('characterAiCancelRequest'), 'import footer shows disabled waiting button instead of cancel')
check(confirmed.nodes(node => node.type === 'button' && node.props['aria-label'] === 'close')[0].props.disabled, 'close control disabled while confirmed import is pending')
check(confirmed.nodes(node => node.props?.role === 'dialog')[0].props['aria-busy'], 'pending import remains busy')
confirmedImport.resolve({ created: 1, skipped: 0, characters: [{ name: 'Confirmed Fixture' }] })
await Promise.all([confirmedRun, duplicateRun])
check(confirmedNotify === 1 && confirmedClose === 1 && !confirmedSignal.aborted, 'confirmed import result notifies once and closes normally without abort')
confirmed.unmount()

for (const departure of ['context', 'unmount']) {
  const pending = deferred()
  let signal, callbacks = 0
  const detached = mount({ call: (method, input, options) => {
    if (method === 'aiInfo') return model
    if (method === 'characterAi') return { characters: [{ name: 'Detached Fixture' }] }
    signal = options.signal
    return pending.promise
  }, onImported: () => callbacks++, onClose: () => callbacks++ })
  await detached.settle()
  await detached.button('characterAiStartExtract').props.onClick()
  await detached.settle()
  const importingDetached = detached.button('characterAiConfirmImport').props.onClick()
  if (departure === 'context') { detached.props.novelId = 99; detached.sync() } else detached.unmount()
  check(!signal.aborted, `${departure} detaches import UI without claiming to abort committed writes`)
  pending.resolve({ created: 1, skipped: 0, characters: [{ name: 'Detached Fixture' }] })
  await importingDetached
  check(callbacks === 0, `${departure} ignores expired import callbacks`)
  if (departure === 'context') detached.unmount()
}

function rangeResult(characters, nextCursor, availableChapters = 2) {
  return { characters, source: { scope: 'range', analyzedChapters: 1, availableChapters, truncated: nextCursor != null, nextCursor, done: nextCursor == null } }
}
const select = (fixture, key) => fixture.nodes(node => node.type === 'select' && node.props['aria-label'] === key)[0]
const checks = fixture => fixture.nodes(node => node.type === 'input' && node.props.type === 'checkbox')
const fieldsets = fixture => fixture.nodes(node => node.type === 'fieldset')
const edit = (fixture, row, field, value) => {
  const input = fieldsets(fixture)[row].props.children[2].props.children[fields.indexOf(field)].props.children
  input.props.onChange({ target: { value } })
  fixture.sync()
}
const read = (fixture, row, field) => fieldsets(fixture)[row].props.children[2].props.children[fields.indexOf(field)].props.children.props.value

const batchRequests = []
const batchImports = []
const canceledBatch = deferred()
const firstCursor = { chapterIndex: 0, offset: 6000 }
const handoffCursor = { chapterIndex: 1, offset: 0 }
let batchClosed = 0
const batch = mount({
  call: async (method, input, options) => {
    if (method === 'aiInfo') return model
    if (method === 'importCharacters') {
      batchImports.push(input)
      return { created: input.characters.length, skipped: 0, characters: batchImports.flatMap(row => row.characters) }
    }
    batchRequests.push({ input, signal: options.signal })
    switch (batchRequests.length) {
      case 1: return rangeResult([{ name: 'Alice', alias: 'A', appearance: 'First outfit', personality: 'first personality' }], firstCursor)
      case 2: throw Error('fixture max tokens')
      case 3: return rangeResult([{ name: 'Invalid Cursor Fixture' }], firstCursor)
      case 4: return canceledBatch.promise
      case 5: return rangeResult([{ name: 'ＡＬＩＣＥ', alias: 'must not restore', appearance: 'should not override', background: 'new fact', personality: 'do not replace' }, ...Array.from({ length: 29 }, (_, index) => ({ name: `Batch person ${index}` }))], handoffCursor)
      case 6: return rangeResult([{ name: ' alice ', age: '31' }, { name: 'Final person A' }, { name: 'Final person B' }], null)
      default: throw Error('a batch was called without the author clicking')
    }
  }, onClose: () => batchClosed++,
})
await batch.settle()
select(batch, 'characterAiScope').props.onChange({ target: { value: 'range' } })
batch.sync()
select(batch, 'characterAiRangeStart').props.onChange({ target: { value: '6' } })
batch.sync()
select(batch, 'characterAiRangeEnd').props.onChange({ target: { value: '8' } })
batch.sync()
check(batch.text().includes('characterAiRangeInvalid') && batch.button('characterAiStartExtract').props.disabled, 'reversed chapter order blocks the request')
select(batch, 'characterAiRangeStart').props.onChange({ target: { value: '11' } })
batch.sync()
await batch.button('characterAiStartExtract').props.onClick()
await batch.settle()
check(batchRequests.length === 1 && batchRequests[0].input.scope === 'range' && batchRequests[0].input.startChapterId === 11 && batchRequests[0].input.endChapterId === 8 && !Object.hasOwn(batchRequests[0].input, 'batchCursor'), 'inclusive selected IDs hit exactly one initial model call')
check(batch.text().includes('characterAiBatchProgress 0 / 2') && batch.text().includes('characterAiBatchAnalyzed 1') && !batch.text().includes('characterAiTruncated'), 'partial long chapter reports successful batch separately from range progress')
select(batch, 'characterAiRangeEnd').props.onChange({ target: { value: '6' } })
batch.sync()
check(select(batch, 'characterAiRangeEnd').props.value === '8' && fieldsets(batch).length === 1 && Boolean(batch.button('characterAiResetApply')), 'range change waits for confirmation without clearing candidates')
batch.button('characterAiResetKeep').props.onClick()
batch.sync()
check(select(batch, 'characterAiRangeEnd').props.value === '8' && !batch.button('characterAiResetApply'), 'canceling range change keeps the previous preview')
edit(batch, 0, 'name', 'Alice Renamed')
edit(batch, 0, 'alias', '')
edit(batch, 0, 'appearance', 'Author-edited outfit')
checks(batch)[0].props.onChange({ target: { checked: false } })
batch.sync()
for (const error of ['fixture max tokens', 'characterAiBatchInvalid']) {
  await batch.button('characterAiNextBatch').props.onClick()
  await batch.settle()
  check(batch.text().includes(error) && fieldsets(batch).length === 1 && read(batch, 0, 'name') === 'Alice Renamed' && batch.text().includes('characterAiBatchProgress 0 / 2'), 'failed or non-progressing response leaves successful data and cursor untouched')
}
const canceled = batch.button('characterAiNextBatch').props.onClick()
batch.sync()
batch.button('characterAiCancelRequest').props.onClick()
check(batchRequests.at(-1).signal.aborted, 'cancel next batch aborts that request')
canceledBatch.resolve(rangeResult([{ name: 'Canceled Late' }], null))
await canceled
await batch.settle()
check(fieldsets(batch).length === 1 && batch.text().includes('characterAiCancelled') && Boolean(batch.button('characterAiNextBatch')), 'late canceled batch cannot advance, append or remove prior candidates')
await batch.button('characterAiNextBatch').props.onClick()
await batch.settle()
assert.deepEqual(batchRequests.slice(1, 5).map(row => row.input.batchCursor), Array(4).fill(firstCursor))
check(batchImports.length === 0 && !checks(batch)[0].props.checked && fieldsets(batch).length === 30 && read(batch, 0, 'name') === 'Alice Renamed' && read(batch, 0, 'alias') === '' && read(batch, 0, 'appearance') === 'Author-edited outfit' && read(batch, 0, 'personality') === 'first personality' && read(batch, 0, 'background') === 'new fact', 'merge dedupes by original NFKC name and only fills untouched empty fields without changing selection')
await batch.button('characterAiNextBatch').props.onClick()
await batch.settle()
assert.deepEqual(batchRequests.at(-1).input.batchCursor, handoffCursor)
check(fieldsets(batch).length === 32 && checks(batch).filter(node => node.props.checked).length === 30 && checks(batch).at(-1).props.disabled && batch.text().includes('characterAiSelectionLimit') && batch.text().includes('characterAiBatchDone') && !batch.button('characterAiNextBatch') && read(batch, 0, 'age') === '31', 'new candidates fill available selection slots without dropping the excess')
checks(batch).at(-1).props.onChange({ target: { checked: true } })
batch.sync()
check(checks(batch).filter(node => node.props.checked).length === 30, 'handler independently enforces the 30-person cap')
await batch.button('characterAiConfirmImport').props.onClick()
await batch.settle()
check(batchImports.length === 1 && batchImports[0].characters.length === 30 && batchClosed === 0 && fieldsets(batch).length === 2 && checks(batch).every(node => !node.props.checked && !node.props.disabled), 'only one explicit import of 30 happens and the remaining candidates stay available')
edit(batch, 1, 'name', ' BATCH PERSON 0 ')
check(batch.text().includes('characterAiDuplicate'), 'confirmed import updates existing names before parent props refresh')
checks(batch)[0].props.onChange({ target: { checked: true } })
batch.sync()
await batch.button('characterAiConfirmImport').props.onClick()
await batch.settle()
check(batchImports.length === 2 && batchImports[1].characters[0].name === 'Alice Renamed' && fieldsets(batch).length === 1 && batchClosed === 0, 'remaining candidates require another explicit confirmation')
select(batch, 'characterAiRangeEnd').props.onChange({ target: { value: '6' } })
batch.sync()
batch.button('characterAiResetApply').props.onClick()
batch.sync()
check(fieldsets(batch).length === 0 && select(batch, 'characterAiRangeEnd').props.value === '6' && batchRequests.length === 6, 'confirmed range change clears the preview and does not call the model')
batch.unmount()

const oldCatalog = deferred()
const oldBatch = deferred()
let staleCatalogSignal, staleBatchSignal
const stale = mount({ chapterFixture: true, call: (method, input, options) => {
  if (method === 'aiInfo') return model
  if (method === 'characterAi') { staleBatchSignal = options.signal; return oldBatch.promise }
  if (input.novelId === 7) { staleCatalogSignal = options.signal; return oldCatalog.promise }
  return input.novelId === 99 ? chapters : { chapters: [] }
} })
await stale.settle()
select(stale, 'characterAiScope').props.onChange({ target: { value: 'range' } })
stale.sync()
check(stale.button('characterAiStartExtract').props.disabled && stale.text().includes('characterAiChaptersLoading'), 'waits for chapter metadata before range analysis')
stale.props.novelId = 99
await stale.settle()
check(staleCatalogSignal.aborted, 'chapter catalogue read is canceled when novel changes')
oldCatalog.resolve({ chapters: [{ id: 1000, title: 'Wrong Novel Catalogue' }] })
select(stale, 'characterAiScope').props.onChange({ target: { value: 'all' } })
await stale.settle()
const pendingRange = stale.button('characterAiStartExtract').props.onClick()
stale.props.novelId = 101
await stale.settle()
check(staleBatchSignal.aborted, 'pending range preview is canceled when novel changes')
oldBatch.resolve(rangeResult([{ name: 'Wrong Novel Candidate' }], null, 3))
await pendingRange
await stale.settle()
select(stale, 'characterAiScope').props.onChange({ target: { value: 'range' } })
stale.sync()
check(!stale.text().includes('Wrong Novel') && fieldsets(stale).length === 0 && !select(stale, 'characterAiRangeStart') && stale.text().includes('characterAiChaptersEmpty') && stale.button('characterAiStartExtract').props.disabled, 'late catalogue and range result cannot change an empty new-context preview')
stale.unmount()

console.log(`Character AI UI checks passed (${assertions} assertions; React 18 SSR + offline lifecycle fixtures).`)
