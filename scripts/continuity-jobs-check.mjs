// Actual useContinuityJobs callbacks with isolated globals and deferred fake calls.
// No browser, manuscript database, model, dependency install, or generated files.
import assert from 'node:assert/strict'
import React from 'react'
import { useContinuityJobs } from '../src/continuity-jobs.js'

const tick = () => new Promise(resolve => setImmediate(resolve))
const t = key => key
const result = (filled = 1, foreshadowAdded = 0) => ({ filled, foreshadowAdded, alreadyOrganized: false, ledgerSkipped: false })
const chapter = (id = 11, extra = {}) => ({ id, novelId: 1, title: `合成章节${id}`, content: `合成夹具正文${id}`, token: `chapter-${id}-v1`, status: '已发布', ...extra })
const abortError = () => Object.assign(new Error('Synthetic request aborted'), { name: 'AbortError', code: 'ABORTED' })

function mount(supplied) {
  const slots = []; let cursor = 0, dirty = false, effects = [], output, mounted = true
  const metrics = { writesAfterUnmount: 0 }
  const props = { status: { dbPath: 'fixture/database-a', user: { id: 1 } }, novelId: 1, writable: true, t, ...supplied }
  const same = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]))
  const dispatcher = {
    useState(initial) {
      const index = cursor++
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial }
      return [slots[index].value, next => {
        if (!mounted) metrics.writesAfterUnmount++
        const value = typeof next === 'function' ? next(slots[index].value) : next
        if (!Object.is(value, slots[index].value)) { slots[index].value = value; dirty = true }
      }]
    },
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value } },
    useEffect(fn, deps) {
      const index = cursor++
      if (!same(deps, slots[index]?.deps)) {
        effects.push({ index, fn })
        slots[index] = { deps, cleanup: slots[index]?.cleanup }
      }
    },
  }
  function sync() {
    if (!mounted) return
    for (let attempt = 0; attempt < 30; attempt++) {
      cursor = 0; dirty = false; effects = []
      const holder = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher
      const previous = holder.current; holder.current = dispatcher
      try { output = useContinuityJobs(props) } finally { holder.current = previous }
      const pending = effects
      for (const effect of pending) slots[effect.index].cleanup?.()
      for (const effect of pending) slots[effect.index].cleanup = effect.fn()
      if (!dirty) return
    }
    throw Error('Hook state did not settle')
  }
  const settle = async () => { for (let index = 0; index < 4; index++) { sync(); await tick() } sync() }
  sync()
  return {
    props, metrics, sync, settle, get value() { return output },
    unmount() { if (!mounted) return; mounted = false; for (const slot of slots) slot?.cleanup?.() },
  }
}

async function fixture(run) {
  const originals = Object.fromEntries(['window', 'localStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const values = new Map(), confirmations = [], notices = [], requests = []
  const controls = { confirm: true, storageReadFails: false, storageWriteFails: false, ignoreAbort: false }
  const storage = {
    getItem(key) { if (controls.storageReadFails) throw Error('Synthetic storage read failure'); return values.get(key) ?? null },
    setItem(key, value) { if (controls.storageWriteFails) throw Error('Synthetic storage write failure'); values.set(key, String(value)) },
  }
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: { confirm(message) { confirmations.push(message); return controls.confirm } } })
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: storage })
  const call = (method, payload, { signal } = {}) => {
    assert.equal(method, 'organizeContinuity')
    assert.ok(signal instanceof AbortSignal)
    let resolve, reject
    const promise = new Promise((yes, no) => { resolve = yes; reject = no })
    const request = {
      method, payload, signal, settled: false,
      resolve(value = result()) { if (this.settled) return; this.settled = true; signal.removeEventListener('abort', onAbort); resolve(value) },
      reject(error = Error('Synthetic model failure')) { if (this.settled) return; this.settled = true; signal.removeEventListener('abort', onAbort); reject(error) },
    }
    const onAbort = () => { if (!controls.ignoreAbort) request.reject(abortError()) }
    signal.addEventListener('abort', onAbort, { once: true })
    requests.push(request)
    if (signal.aborted) onAbort()
    return promise
  }
  const app = mount({ call, notify: (kind, message) => notices.push({ kind, message }) })
  try { await run({ app, values, confirmations, notices, requests, controls, storage }) }
  finally {
    app.unmount()
    for (const request of requests) if (!request.settled) request.reject(abortError())
    await tick()
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
}

let passed = 0
const failures = []
async function check(name, run) {
  try { await fixture(run); passed++; console.log(`ok ${passed + failures.length} - ${name}`) }
  catch (error) { failures.push({ name, error }); console.error(`not ok ${passed + failures.length} - ${name}\n${error.stack}`) }
}

await check('auto defaults off; preferences are independent by database, user and novel', async ({ app, values, confirmations }) => {
  assert.equal(app.value.enabled, false)
  app.value.setAuto(true); await app.settle()
  assert.equal(app.value.enabled, true); assert.equal(confirmations.length, 1)
  assert.equal([...values.values()][0], '1')
  app.props.novelId = 2; app.sync(); assert.equal(app.value.enabled, false)
  app.value.setAuto(true); app.sync(); assert.equal(app.value.enabled, true)
  app.props.novelId = 1; app.sync(); assert.equal(app.value.enabled, true)
  app.props.status = { dbPath: 'fixture/database-a', user: { id: 2 } }; app.sync(); assert.equal(app.value.enabled, false)
  app.props.status = { dbPath: 'fixture/database-b', user: { id: 1 } }; app.sync(); assert.equal(app.value.enabled, false)
  app.props.status = { dbPath: 'fixture/database-a', user: { id: 1 } }; app.sync(); assert.equal(app.value.enabled, true)
  assert.equal(values.size, 2)
})

await check('enable requires confirmation and writing; failed storage reports once and off remains available', async ({ app, controls, confirmations, notices }) => {
  controls.confirm = false; app.value.setAuto(true); app.sync(); assert.equal(app.value.enabled, false)
  controls.confirm = true; controls.storageWriteFails = true
  app.value.setAuto(true); app.sync()
  assert.equal(app.value.enabled, true)
  assert.deepEqual(notices, [{ kind: 'info', message: 'continuityOrganizerPreferenceNotSaved' }])
  const oldToggle = app.value.setAuto
  app.props.writable = false; app.sync(); oldToggle(false); app.sync(); assert.equal(app.value.enabled, false)
  oldToggle(true); app.sync(); assert.equal(app.value.enabled, false)
  assert.equal(confirmations.length, 2, 'Turning off or a read-only enable must not confirm')
  app.props.status = { dbPath: 'fixture/unreadable-preference', user: { id: 1 } }; controls.storageReadFails = true; app.sync()
  assert.equal(app.value.enabled, false)
})

await check('missing scope, prose, token, wrong novel, disabled auto and stale expectedScope make no request', async ({ app, requests }) => {
  const enqueue = app.value.enqueue
  enqueue(chapter(), true)
  enqueue(chapter(11, { content: ' \n\t' }))
  enqueue(chapter(11, { token: '' }))
  enqueue(chapter(11, { novelId: 2 }))
  enqueue(chapter(), false, 'stale-scope')
  app.props.status = null; app.sync(); enqueue(chapter())
  assert.equal(app.value.scopeKey, null)
  app.props.status = { dbPath: 'fixture/database-a', user: { id: 1 } }; app.props.writable = false; app.sync(); enqueue(chapter())
  await app.settle(); assert.equal(requests.length, 0)
  app.props.writable = true; app.sync(); app.value.setAuto(true); app.sync()
  app.value.enqueue(chapter(11, { status: '草稿' }), true)
  app.value.enqueue(chapter(12, { novelId: 2 }), true)
  await app.settle(); assert.equal(requests.length, 0, 'Only enabled target novels and published chapters may auto-enqueue')
})

await check('one manual click starts once; double taps dedupe and preserve scope/token/title ownership', async ({ app, requests }) => {
  const target = chapter()
  const enqueue = app.value.enqueue
  enqueue(target); enqueue(target); enqueue(chapter(12)); app.sync()
  assert.equal(requests.length, 1)
  assert.deepEqual(requests[0].payload, {
    novelId: 1, chapterId: 11, expectedChapterToken: 'chapter-11-v1',
    scope: { dbPath: 'fixture/database-a', userId: 1 }, requirePublished: false,
  })
  target.title = '修改后的标题'; target.token = 'new-token'
  app.props.novelId = 2; app.sync()
  assert.equal(app.value.task.title, '合成章节11')
  assert.equal(app.value.task.chapterId, 11)
  requests[0].resolve(result(2, 1)); await app.settle()
  assert.equal(app.value.task, null, 'A completed task must not belong to a different novel')
  assert.equal(app.value.refreshVersion, 1)
  app.props.novelId = 1; app.sync()
  assert.equal(app.value.task.phase, 'done'); assert.equal(app.value.task.title, '合成章节11')
  assert.equal(app.value.task.result.filled, 2)
  assert.equal(requests.length, 1)
})

await check('automatic chapters run serially; queued snapshots keep the exact chapter token and title', async ({ app, requests, notices }) => {
  app.value.setAuto(true); app.sync()
  const next = chapter(12)
  app.value.enqueue(chapter(), true); app.value.enqueue(next, true); app.value.enqueue(next, true); app.sync()
  next.title = '队列外标题'; next.token = 'queue-external-token'
  assert.equal(requests.length, 1)
  requests[0].resolve(result()); await app.settle()
  assert.equal(requests.length, 2)
  assert.equal(requests[1].payload.requirePublished, true)
  assert.equal(requests[1].payload.expectedChapterToken, 'chapter-12-v1')
  assert.equal(app.value.task.chapterId, 12); assert.equal(app.value.task.title, '合成章节12')
  requests[1].resolve(result(0, 1)); await app.settle()
  assert.equal(requests.length, 2); assert.equal(app.value.refreshVersion, 2)
  assert.deepEqual(notices.map(row => row.message), ['continuityOrganizerDone · 合成章节11', 'continuityOrganizerDone · 合成章节12'])
})

await check('a failed automatic chapter is not retried and the following chapter still runs', async ({ app, requests, notices }) => {
  app.value.setAuto(true); app.sync()
  app.value.enqueue(chapter(), true); app.value.enqueue(chapter(12), true)
  requests[0].reject(Error('Synthetic no model configured')); await app.settle()
  assert.equal(requests.length, 2); assert.equal(app.value.task.chapterId, 12)
  assert.equal(notices.length, 1); assert.equal(notices[0].kind, 'error')
  assert.match(notices[0].message, /合成章节11.*Synthetic no model configured/)
  requests[1].resolve(result()); await app.settle(); await app.settle()
  assert.equal(requests.length, 2); assert.equal(app.value.refreshVersion, 1)
  assert.equal(notices.filter(row => row.kind === 'error').length, 1)
  assert.equal(notices.filter(row => row.kind === 'info').length, 1)
})

await check('cancel aborts the signal; AbortError yields cancelled without success or error notices', async ({ app, requests, notices }) => {
  app.value.setAuto(true); app.sync(); app.value.enqueue(chapter(), true); app.sync()
  app.value.cancel(); await app.settle()
  assert.equal(requests[0].signal.aborted, true)
  assert.equal(app.value.task.phase, 'cancelled')
  assert.equal(app.value.refreshVersion, 0)
  assert.deepEqual(notices, [])
  app.value.enqueue(chapter(12)); app.sync()
  requests[1].reject(abortError()); await app.settle()
  assert.equal(requests[1].signal.aborted, false, 'The ABORTED service code is also recognized without a local abort')
  assert.equal(app.value.task.phase, 'cancelled'); assert.equal(app.value.refreshVersion, 0)
  assert.deepEqual(notices, [])
})

// Explicit successful responses represent work already committed before cancellation.
// Abort does not prove rollback: only an ABORTED rejection represents no write here.
await check('a cancel request followed by explicit committed success reports done accurately', async ({ app, requests, controls, notices }) => {
  controls.ignoreAbort = true
  app.value.setAuto(true); app.sync(); app.value.enqueue(chapter(), true); app.sync()
  app.value.cancel(); assert.equal(requests[0].signal.aborted, true)
  const committed = result(3, 2)
  requests[0].resolve(committed); await app.settle()
  assert.equal(app.value.task.phase, 'done', 'A committed response must not be falsely reported as cancelled')
  assert.deepEqual(app.value.task.result, committed)
  assert.equal(app.value.refreshVersion, 1)
  assert.deepEqual(notices, [{ kind: 'info', message: 'continuityOrganizerDone · 合成章节11' }])
})

await check('turning auto off aborts and drops its queue while reporting already committed work', async ({ app, requests, controls, notices }) => {
  controls.ignoreAbort = true
  app.value.setAuto(true); app.sync(); app.value.enqueue(chapter(), true); app.value.enqueue(chapter(12), true)
  app.value.setAuto(false); app.sync()
  assert.equal(app.value.enabled, false); assert.equal(requests[0].signal.aborted, true)
  requests[0].resolve(result()); await app.settle()
  assert.equal(requests.length, 1, 'Disabling auto drops pending automatic chapters')
  assert.equal(app.value.task.phase, 'done')
  assert.equal(app.value.refreshVersion, 1)
  assert.deepEqual(notices, [{ kind: 'info', message: 'continuityOrganizerDone · 合成章节11' }])
})

await check('writing off aborts and clears pending work; a preexisting commit remains truthful', async ({ app, requests, controls, notices }) => {
  app.value.setAuto(true); app.sync(); app.value.enqueue(chapter(), true); app.value.enqueue(chapter(12), true)
  const oldEnqueue = app.value.enqueue
  app.props.writable = false; app.sync(); await app.settle()
  assert.equal(requests[0].signal.aborted, true)
  oldEnqueue(chapter(13)); assert.equal(requests.length, 1)
  assert.equal(app.value.task.phase, 'cancelled'); assert.equal(app.value.refreshVersion, 0)
  assert.deepEqual(notices, [], 'An ABORTED response after writing off must not claim a save')
  app.props.writable = true; app.sync(); controls.ignoreAbort = true
  app.value.enqueue(chapter(21), true); app.value.enqueue(chapter(22), true)
  app.props.writable = false; app.sync()
  assert.equal(requests[1].signal.aborted, true)
  requests[1].resolve(result()); await app.settle()
  assert.equal(requests.length, 2, 'Writing off forbids queued or new requests')
  assert.equal(app.value.task.phase, 'done', 'The response confirms a commit before writing was turned off')
  assert.equal(app.value.refreshVersion, 1)
  assert.deepEqual(notices, [{ kind: 'info', message: 'continuityOrganizerDone · 合成章节21' }])
})

await check('database switch rejects stale scope and isolates late results before the new scope runs', async ({ app, requests, controls, notices }) => {
  controls.ignoreAbort = true
  app.value.setAuto(true); app.sync()
  const oldScope = app.value.scopeKey, enqueue = app.value.enqueue
  enqueue(chapter(), true); enqueue(chapter(12), true)
  app.props.status = { dbPath: 'fixture/database-b', user: { id: 9 } }; app.sync()
  assert.equal(requests[0].signal.aborted, true)
  assert.equal(app.value.task, null); assert.equal(app.value.enabled, false)
  enqueue(chapter(13), false, oldScope)
  assert.equal(requests.length, 1)
  requests[0].resolve(result(3, 1)); await app.settle()
  assert.equal(app.value.task, null); assert.equal(app.value.refreshVersion, 0)
  assert.deepEqual(notices, [])
  assert.equal(requests.length, 1, 'The old scope queue was discarded')
  enqueue(chapter(21), false, app.value.scopeKey); app.sync()
  assert.equal(requests.length, 2)
  assert.deepEqual(requests[1].payload.scope, { dbPath: 'fixture/database-b', userId: 9 })
  assert.equal(requests[1].payload.chapterId, 21)
  assert.equal(app.value.refreshVersion, 0); assert.deepEqual(notices, [])
  requests[1].resolve(result()); await app.settle()
  assert.equal(app.value.task.chapterId, 21); assert.equal(app.value.refreshVersion, 1)
})

await check('unmount aborts work and clears its queue; delayed results cannot mutate state or notify', async ({ app, requests, controls, notices }) => {
  controls.ignoreAbort = true
  app.value.setAuto(true); app.sync(); app.value.enqueue(chapter(), true); app.value.enqueue(chapter(12), true)
  const oldEnqueue = app.value.enqueue
  app.unmount(); assert.equal(requests[0].signal.aborted, true)
  oldEnqueue(chapter(13), true)
  requests[0].resolve(result(3, 1)); await app.settle()
  assert.equal(requests.length, 1); assert.equal(app.metrics.writesAfterUnmount, 0)
  assert.deepEqual(notices, [])
})

if (failures.length) {
  console.error(`FAIL: ${failures.length}/${passed + failures.length} continuity job checks failed; ${passed} passed.`)
  process.exitCode = 1
} else console.log(`PASS: ${passed} continuity job hook checks; isolated synthetic data and deferred callbacks only.`)
