export const DENSITY_KEY = 'qibi:density:v1'
export const DEFAULT_DENSITY = 'comfortable'

export function normalizeDensity(value) {
  return value === 'compact' || value === 'comfortable' ? value : DEFAULT_DENSITY
}

export function readDensity(storage) {
  try { return normalizeDensity((storage === undefined ? globalThis.localStorage : storage)?.getItem(DENSITY_KEY)) }
  catch { return DEFAULT_DENSITY }
}

export function saveDensity(value, storage) {
  const density = normalizeDensity(value)
  try {
    ;(storage === undefined ? globalThis.localStorage : storage).setItem(DENSITY_KEY, density)
    return { density, saved: true }
  } catch { return { density, saved: false } }
}
