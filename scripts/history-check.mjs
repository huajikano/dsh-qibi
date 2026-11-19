import assert from 'node:assert/strict'
import vm from 'node:vm'
import { build } from 'esbuild'

// Exercise the actual history click handler and a subsequent render with no browser or real history.
const { outputFiles } = await build({
  entryPoints: [new URL('../src/panel.jsx', import.meta.url).pathname.replace(/^\/([a-z]:)/i, '$1')],
  bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react'], jsx: 'transform', logLevel: 'silent',
})
const fixture = { id: 'saved-selection', mode: 'polish-selection', label: 'fixture polish', text: '润色候选', at: 1, truncated: false }
function drawerHarness(entries, selection = null) {
  const hooks = []
  let index = 0
  const React = {
    Fragment: 'Fragment',
    createElement(type, props, ...children) { return { type, props: { ...props, children } } },
    useState(initial) { const at = index++; if (!(at in hooks)) hooks[at] = typeof initial === 'function' ? initial() : initial; return [hooks[at], next => { hooks[at] = typeof next === 'function' ? next(hooks[at]) : next }] },
    useRef(initial) { const at = index++; return hooks[at] ??= { current: initial } },
    useEffect() { index += 1 },
    useCallback(fn) { index += 1; return fn },
    useMemo(fn) { index += 1; return fn() },
  }
  const module = { exports: {} }
  const storage = new Map([['qibi:ai-drafts', JSON.stringify({ 1: entries })]])
  vm.runInNewContext(outputFiles[0].text, {
    module, exports: module.exports,
    require(name) { if (name === 'react') return React; throw new Error(`Unexpected runtime import: ${name}`) },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    AbortController, console,
  })
  const props = {
    call: async () => ({}), novelId: 1, chapterId: 1, draft: '原始文本', selection,
    writable: true, info: { available: true, model: 'fixture', modes: [{ id: 'draft', group: 'chapter' }, { id: 'continue', group: 'chapter' }, { id: 'polish-selection', group: 'selection' }] },
    t: key => key, notify() {}, onApply() {}, onClose() {},
  }
  return { render() { index = 0; return module.exports.AiDrawer(props) }, module: module.exports, storage }
}
function find(node, predicate) {
  if (Array.isArray(node)) { for (const child of node) { const result = find(child, predicate); if (result) return result } }
  else if (node && typeof node === 'object') { if (predicate(node)) return node; return find(node.props?.children, predicate) }
  return null
}
const harness = drawerHarness([fixture])
let tree = harness.render()
const historyButton = find(tree, node => node.props?.className === 'qibi-draft-main')
assert.ok(historyButton)
historyButton.props.onClick()
assert.doesNotThrow(() => { tree = harness.render() }, 'Loading a selection history record without an active selection must not blank the plugin')
const apply = find(tree, node => node.type === 'button' && node.props.children.flat().includes('aiApply'))
assert.ok(apply)
assert.equal(apply.props.disabled, true, 'Legacy history without an original selection is preview-only')
assert.ok(find(tree, node => node.type === 'button' && node.props.children.flat().includes('exportCopy')))
const valid = { ...fixture, selection: { chapterId: 1, from: 0, to: 4, text: '原始文本' } }
const restored = drawerHarness([valid])
let restoredTree = restored.render()
find(restoredTree, node => node.props?.className === 'qibi-draft-main').props.onClick()
restoredTree = restored.render()
const restoredApply = find(restoredTree, node => node.type === 'button' && node.props.children.flat().includes('aiApply'))
assert.equal(restoredApply.props.disabled, false)
const mismatched = drawerHarness([{ ...valid, selection: { ...valid.selection, text: '已经改变' } }])
let staleTree = mismatched.render()
find(staleTree, node => node.props?.className === 'qibi-draft-main').props.onClick()
staleTree = mismatched.render()
assert.equal(find(staleTree, node => node.type === 'button' && node.props.children.flat().includes('aiApply')).props.disabled, true)
assert.doesNotThrow(() => drawerHarness([null, { mode: 'polish-selection', text: null }, fixture]).render())
const ambiguous = drawerHarness([{ ...fixture, mode: 'continue', forceRewrite: true }])
let legacyTree = ambiguous.render()
find(legacyTree, node => node.props?.className === 'qibi-draft-main').props.onClick()
legacyTree = ambiguous.render()
assert.equal(find(legacyTree, node => node.type === 'button' && node.props.children.flat().includes('aiApply')).props.disabled, true, 'Old continuation history must never replace a whole chapter when its origin is unknown')
const modern = drawerHarness([{ ...fixture, mode: 'continue', forceRewrite: true, complete: true }])
let modernTree = modern.render()
find(modernTree, node => node.props?.className === 'qibi-draft-main').props.onClick()
modernTree = modern.render()
assert.equal(find(modernTree, node => node.type === 'button' && node.props.children.flat().includes('aiApply')).props.disabled, false)
const malformed = drawerHarness([null, fixture])
malformed.storage.set('qibi:ai-drafts', JSON.stringify({ 1: [null, fixture], 2: { invalid: true }, 3: [{ ...fixture, label: { invalid: true } }] }))
assert.doesNotThrow(() => malformed.module.removeAiDraft(1, fixture.id))
assert.doesNotThrow(() => malformed.module.saveAiDraft(1, { ...fixture, id: 'new' }))
assert.equal(malformed.module.listAiDrafts(1).length, 1)
assert.equal(typeof malformed.module.listAiDrafts(3)[0].label, 'string')
console.log('PASS: actual history click/rerender stays safe; only matching original ranges can replace selections; ambiguous legacy continuations are read-only; malformed histories support safe read/save/delete.')
