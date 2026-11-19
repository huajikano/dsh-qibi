import assert from 'node:assert/strict'
import { distillStage, distillInstruction } from '../src/distill-guide.js'

assert.equal(distillStage({ detail: null }), 'setup')
assert.equal(distillStage({ detail: { id: 2, sources: [] } }), 'materials')
assert.equal(distillStage({ detail: { id: 2, sources: [{ status: 'error' }] } }), 'materials')
assert.equal(distillStage({ detail: { id: 2, sources: [{ status: 'ready' }] } }), 'generate')
assert.equal(distillStage({ detail: { id: 2, currentVersion: { id: 1 } }, boundAuthorId: 3 }), 'bind')
assert.equal(distillStage({ detail: { id: 2, currentVersion: { id: 1 } }, boundAuthorId: 2 }), 'done')
const result = distillInstruction({ id: 2, name: '合成测试作者' })
assert.ok(result.includes('authorId=2'))
assert.ok(result.includes('action=read') && result.includes('action=save'))
assert.ok(result.includes('应用到当前作品'))
assert.ok(!result.includes('action=bind'), 'The chat instructions should not silently bind a style to a novel')
assert.throws(() => distillInstruction({ id: -1 }))
console.log('PASS: guided author flow follows materials, versions and binding without sending a message or binding automatically.')
