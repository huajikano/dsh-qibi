/**
 * “今日新增字数”的本地基线。
 *
 * 只按作品总字数的差值估算：当天第一次看到这部作品时记下当时字数，
 * 之后显示相对该基线的增量。它不区分是插件写的还是别的窗口写的，也不上传任何数据。
 */

export const DAILY_KEY_PREFIX = 'qibi:daily:v1:'

export function dayStamp(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dailyKey(scope, novelId) {
  return scope && novelId != null ? `${DAILY_KEY_PREFIX}${JSON.stringify([scope, novelId])}` : null
}

/** 返回 { baseline, today, reset }；存储不可用或数据损坏时按“从当前字数开始”处理。 */
export function resolveDailyBaseline({ storage, key, words = 0, today = dayStamp() } = {}) {
  const current = Number.isFinite(Number(words)) ? Math.max(0, Number(words)) : 0
  if (!key) return { baseline: current, today, reset: false }
  let saved = null
  try {
    const raw = storage?.getItem(key)
    if (raw) saved = JSON.parse(raw)
  } catch { saved = null }
  const valid = saved && typeof saved === 'object' && saved.date === today && Number.isFinite(Number(saved.baseline))
  if (valid) return { baseline: Math.max(0, Number(saved.baseline)), today, reset: false }
  try { storage?.setItem(key, JSON.stringify({ date: today, baseline: current })) } catch { /* 隐私模式忽略 */ }
  return { baseline: current, today, reset: true }
}

export function dailyDelta(words, baseline) {
  const current = Number.isFinite(Number(words)) ? Number(words) : 0
  const base = Number.isFinite(Number(baseline)) ? Number(baseline) : current
  return Math.max(0, current - base)
}
