import assert from 'node:assert/strict'
import { DENSITY_KEY, DEFAULT_DENSITY, normalizeDensity, readDensity, saveDensity } from '../src/density.js'

assert.equal(DEFAULT_DENSITY, 'comfortable')
for (const value of [null, undefined, '', 'bad', {}, []]) assert.equal(normalizeDensity(value), 'comfortable')
assert.equal(normalizeDensity('compact'), 'compact')
const values = new Map([['unrelated', 'preserve']])
const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
assert.equal(readDensity(storage), 'comfortable')
assert.deepEqual(saveDensity('compact', storage), { density: 'compact', saved: true })
assert.equal(values.get(DENSITY_KEY), 'compact')
assert.equal(readDensity(storage), 'compact')
assert.deepEqual(saveDensity('comfortable', storage), { density: 'comfortable', saved: true })
assert.equal(readDensity(storage), 'comfortable')
assert.equal(values.get('unrelated'), 'preserve')
const denied = { getItem() { throw Error('denied') }, setItem() { throw Error('denied') } }
assert.equal(readDensity(denied), 'comfortable')
assert.deepEqual(saveDensity('compact', denied), { density: 'compact', saved: false })
const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
try {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
  assert.equal(saveDensity('compact').saved, true)
  assert.equal(readDensity(), 'compact')
} finally {
  if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
  else delete globalThis.localStorage
}
console.log('PASS: comfortable default, compact fallback, separate remembered density and storage failures.')
