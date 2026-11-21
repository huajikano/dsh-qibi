// 今日新增字数基线：按天重置、损坏数据自愈、删除不计负值。
import assert from 'node:assert/strict'
import { DAILY_KEY_PREFIX, dailyDelta, dailyKey, dayStamp, resolveDailyBaseline } from '../src/daily-words.js'

const store = new Map()
const storage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) }
const key = dailyKey('["D:\\data",1]', 7)
assert.ok(key.startsWith(DAILY_KEY_PREFIX))
assert.equal(dailyKey(null, 7), null, '没有数据位置时不写偏好')

assert.equal(dayStamp(new Date(2026, 0, 5)), '2026-01-05')

const first = resolveDailyBaseline({ storage, key, words: 1000, today: '2026-01-05' })
assert.deepEqual(first, { baseline: 1000, today: '2026-01-05', reset: true })
assert.equal(dailyDelta(1350, first.baseline), 350)
assert.equal(dailyDelta(900, first.baseline), 0, '删字不显示负数')

// 同一天再打开：沿用当天基线，不因当前字数变大而重置
const sameDay = resolveDailyBaseline({ storage, key, words: 1350, today: '2026-01-05' })
assert.equal(sameDay.baseline, 1000)
assert.equal(sameDay.reset, false)

// 第二天：以当天字数为新基线
const nextDay = resolveDailyBaseline({ storage, key, words: 1350, today: '2026-01-06' })
assert.deepEqual(nextDay, { baseline: 1350, today: '2026-01-06', reset: true })

// 损坏数据与存储拒绝都退回“从当前字数开始”
store.set(key, '{not json')
assert.equal(resolveDailyBaseline({ storage, key, words: 1400, today: '2026-01-07' }).baseline, 1400)
const denied = { getItem() { throw new Error('denied') }, setItem() { throw new Error('denied') } }
assert.deepEqual(resolveDailyBaseline({ storage: denied, key, words: 42, today: '2026-01-08' }), { baseline: 42, today: '2026-01-08', reset: true })
assert.deepEqual(resolveDailyBaseline({ storage: null, key: null, words: 5 }), { baseline: 5, today: dayStamp(), reset: false })
console.log('PASS: 今日字数按天重置、损坏自愈、存储拒绝与负数保护。')
