// Offline fixture checks: no manuscript, database, model, browser, or generated bundle.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { transform } from 'esbuild'
import { parseForeshadowing, addForeshadowing, updateForeshadowing, removeForeshadowing } from '../lib/foreshadowing.js'

let assertions = 0
const check = (condition, message) => { assert.ok(condition, message); assertions++ }
const same = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions++ }
const raw = '[ {"id":"keep","name":"Door","content":"Key","open":true,"notes":"Later","custom":{"a":[1,"x"]},"__proto__":{"safe":true}}, "A string" ]'
const parsed = parseForeshadowing(raw)
check(parsed.valid && parsed.editable, 'recognized legacy array is editable')
same(parsed.raw, raw, 'parse retains byte-for-byte raw JSON')
same(updateForeshadowing(raw, 0, {}), raw, 'no-op retains byte-for-byte raw JSON')
const edited = JSON.parse(updateForeshadowing(raw, 0, { title: 'Gate', detail: 'Lock', status: 'resolved', notes: 'Now' }))
same(edited[0], JSON.parse('{"id":"keep","name":"Gate","content":"Lock","open":false,"notes":"Now","custom":{"a":[1,"x"]},"__proto__":{"safe":true}}'), 'legacy fields and unknown nested fields survive edits')
check(!Object.hasOwn(edited[0], 'title') && !Object.hasOwn(edited[0], 'status'), 'legacy keys are never renamed')
same(edited[1], 'A string', 'mixed supported strings survive object edits')
same(JSON.parse(updateForeshadowing(raw, 1, { text: 'Changed' }))[1], 'Changed', 'string entries stay strings')
same(updateForeshadowing(raw, 1, { title: 'Do not upgrade' }), raw, 'string entries cannot silently become objects')
same(updateForeshadowing(raw, 0, { id: 'replace', custom: 'lost' }), raw, 'updates are restricted to supported display fields')
const unknownStatus = '[{"title":"Door","status":"pending-review","unknown":17}]'
check(parseForeshadowing(unknownStatus).editable, 'unknown string status remains representable')
same(JSON.parse(updateForeshadowing(unknownStatus, 0, { title: 'Gate' }))[0].status, 'pending-review', 'unknown status survives unrelated edits')
const unsafe = ['[{"title":"x","unknown":{"duplicate":1,"duplicate":2}}]', '[{"title":"x","unknown":0.100000000000000001}]', '[{"title":"x","unknown":-0}]', '{"entries":[]}', 'null', '[null]', '[17]', '[[]]', '[{"mystery":"x"}]', '[{"title":17}]', '[{"title":"x","name":"y"}]', '[{"title":"x","detail":"a","content":"b"}]', '[{"title":"x","open":true,"status":"open"}]', '[{"title":"x","status":false}]', '[{"title":"x","unknown":9007199254740993}]', '[{"title":"x","unknown":1e400}]']
for (const value of unsafe) {
  check(!parseForeshadowing(value).editable, `unsafe schema stays in advanced: ${value}`)
  same(addForeshadowing(value), value, 'add cannot convert unsafe schema')
  same(updateForeshadowing(value, 0, { title: 'new' }), value, 'update cannot convert unsafe schema')
  same(removeForeshadowing(value, 0), value, 'remove cannot convert unsafe schema')
}
for (const value of ['[', '{"title":', '']) {
  const result = parseForeshadowing(value)
  check(!result.valid && !result.editable && result.error, 'invalid JSON has a readable parse error')
  same(result.raw, value, 'invalid raw survives parsing')
}
const added = JSON.parse(addForeshadowing('[]'))
check(typeof added[0].id === 'string' && added[0].id.length > 0, 'new entry has stable generated id')
same(Object.keys(added[0]).sort(), ['id', 'title', 'detail', 'status', 'notes'].sort(), 'new entry has chosen schema')
same({ ...added[0], id: 'fixture' }, { id: 'fixture', title: '', detail: '', status: 'open', notes: '' }, 'new entry defaults')
same(JSON.parse(updateForeshadowing(JSON.stringify(added), 0, { title: 'Edited' }))[0].id, added[0].id, 'id survives field edits')
same(JSON.parse(removeForeshadowing('["a","b","c"]', 0)), ['b', 'c'], 'delete preserves survivors in order')
for (const fn of [() => addForeshadowing(raw, { disabled: true }), () => updateForeshadowing(raw, 0, { title: 'no' }, { disabled: true }), () => removeForeshadowing(raw, 0, { disabled: true })]) same(fn(), raw, 'disabled pure mutation is a no-op')
same(updateForeshadowing(raw, -1, { title: 'no' }), raw, 'invalid index is a no-op')
same(removeForeshadowing(raw, 99), raw, 'out-of-bounds delete is a no-op')

const require = createRequire(import.meta.url)
const filename = fileURLToPath(new URL('../src/ForeshadowEditor.jsx', import.meta.url))
const source = await readFile(filename, 'utf8')
const compiled = await transform(source, { loader: 'jsx', format: 'cjs', target: 'es2022', sourcefile: filename })
const evaluated = { exports: {} }
const localRequire = id => id === '../lib/foreshadowing.js' ? { parseForeshadowing, addForeshadowing, updateForeshadowing, removeForeshadowing } : require(id)
new Function('require', 'module', 'exports', compiled.code)(localRequire, evaluated, evaluated.exports)
const Editor = evaluated.exports.default
const t = key => key
const html = renderToStaticMarkup(React.createElement(Editor, { value: raw, t, onChange() { throw Error('render cannot write') } }))
check(html.includes('foreshadowTitle') && html.includes('foreshadowAdvanced') && html.includes('<fieldset'), 'SSR includes semantic list fields and advanced JSON')
const invalidHtml = renderToStaticMarkup(React.createElement(Editor, { value: '[', t, disabled: true, onChange() { throw Error('render cannot write') } }))
check(invalidHtml.includes('role="alert"') && invalidHtml.includes('foreshadowJsonInvalid') && invalidHtml.includes('readonly=""') && !invalidHtml.includes('disabled=""'), 'SSR invalid JSON is readable, focusable and read-only')

// Minimal hook runner checks actual event closures and key identity, not browser visuals.
function mount(value, disabled = false) {
  const slots = []
  let cursor = 0, tree
  const writes = []
  const props = { value, disabled, t, onChange(next) { writes.push(next); props.value = next } }
  const dispatcher = {
    useState(initial) { const index = cursor++; slots[index] ??= { value: typeof initial === 'function' ? initial() : initial }; return [slots[index].value, next => { slots[index].value = typeof next === 'function' ? next(slots[index].value) : next }] },
    useRef(initial) { const index = cursor++; slots[index] ??= { current: initial }; return slots[index] },
    useId() { return `fixture-${cursor++}` },
  }
  function render() {
    cursor = 0
    const internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
    const previous = internals.ReactCurrentDispatcher.current
    internals.ReactCurrentDispatcher.current = dispatcher
    try { tree = Editor(props) } finally { internals.ReactCurrentDispatcher.current = previous }
  }
  function* walk(node) {
    if (Array.isArray(node)) { for (const child of node) yield* walk(child); return }
    if (!node || typeof node !== 'object') return
    yield node
    yield* walk(node.props?.children)
  }
  const nodes = predicate => [...walk(tree)].filter(predicate)
  render()
  return { props, writes, render, nodes, button: key => nodes(node => node.type === 'button' && node.props.children === key)[0] }
}
let confirms = 0
const previousWindow = globalThis.window
globalThis.window = { confirm() { confirms++; return false } }
try {
  const rawNode = fixture => fixture.nodes(node => node.type === 'textarea' && node.props['aria-label'] === 'foreshadowRawJson')[0]
  for (const initial of ['[', '{"entries":[]}']) {
    const repair = mount(initial)
    check(rawNode(repair)?.props.value === initial, 'invalid or unsupported initial value automatically opens raw JSON')
    rawNode(repair).props.onChange({ target: { value: '["Repaired"]' } })
    repair.render()
    check(rawNode(repair)?.props.value === '["Repaired"]', 'repairing initial raw JSON to an array keeps raw editor mounted')
    check(repair.nodes(node => node.props?.className === 'qibi-foreshadow-entry').every(node => typeof node.key === 'string' && node.key.length > 0), 'repaired raw array receives valid entry keys')
    repair.button('foreshadowAdvanced').props.onClick()
    repair.render()
    check(!rawNode(repair), 'author can explicitly collapse automatically opened raw editor after repair')
    repair.props.value = initial
    repair.render()
    check(rawNode(repair)?.props.value === initial, 'external invalid or unsupported value opens raw JSON again')
    rawNode(repair).props.onChange({ target: { value: '[]' } })
    repair.render()
    check(rawNode(repair)?.props.value === '[]', 'repairing externally supplied raw JSON keeps raw editor mounted')
  }
  const emptyReadOnly = mount('[]', true)
  check(emptyReadOnly.nodes(node => node.type === 'p' && node.props.children === 'foreshadowEmptyReadOnly').length === 1, 'empty read-only ledger uses read-only hint')
  check(!emptyReadOnly.button('foreshadowAdvanced').props.disabled, 'read-only advanced viewing button remains enabled')
  emptyReadOnly.button('foreshadowAdvanced').props.onClick()
  emptyReadOnly.render()
  check(rawNode(emptyReadOnly)?.props.readOnly === true && !rawNode(emptyReadOnly)?.props.disabled, 'read-only raw textarea remains focusable and selectable')
  rawNode(emptyReadOnly).props.onChange({ target: { value: '["blocked"]' } })
  same(emptyReadOnly.writes, [], 'read-only focusable raw textarea retains callback write gate')
  const fixture = mount('["a","b","c"]')
  const rows = () => fixture.nodes(node => node.props?.className === 'qibi-foreshadow-entry')
  const keys = rows().map(node => node.key)
  fixture.button('foreshadowDelete').props.onClick()
  same(fixture.writes.length, 0, 'cancelled delete does not write')
  globalThis.window.confirm = () => { confirms++; return true }
  fixture.button('foreshadowDelete').props.onClick()
  fixture.render()
  same(rows().map(node => node.key), keys.slice(1), 'deleting first entry keeps survivor keys independent of index')
  fixture.button('foreshadowAdvanced').props.onClick()
  fixture.render()
  const rawInput = () => fixture.nodes(node => node.type === 'textarea' && node.props['aria-label'] === 'foreshadowRawJson')[0]
  rawInput().props.onChange({ target: { value: '[' } })
  fixture.render()
  same(fixture.props.value, '[', 'raw invalid edit reaches controlled parent unchanged')
  fixture.button('foreshadowAdvanced').props.onClick()
  fixture.render()
  same(rawInput().props.value, '[', 'closing advanced cannot hide or overwrite invalid JSON')
  fixture.props.value = '["External"]'
  fixture.render()
  check(fixture.nodes(node => node.type === 'input' && node.props.value === 'External').length === 1, 'external value updates immediately')
  const frozen = mount(raw, true)
  const beforeConfirm = confirms
  for (const node of frozen.nodes(node => node.props?.onChange)) node.props.onChange({ target: { value: 'no' } })
  frozen.button('foreshadowAdd').props.onClick()
  frozen.button('foreshadowDelete').props.onClick()
  frozen.button('foreshadowAdvanced').props.onClick()
  frozen.render()
  for (const node of frozen.nodes(node => node.props?.onChange)) node.props.onChange({ target: { value: 'no' } })
  same(frozen.writes, [], 'disabled event callbacks never write, including advanced raw')
  same(confirms, beforeConfirm, 'disabled delete never opens confirm')
} finally { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow }
console.log(`foreshadow-check: ${assertions} assertions passed (offline fixtures + React SSR/event closures)`)
