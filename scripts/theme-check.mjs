import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  THEMES,
  DEFAULT_THEME,
  PREFERENCE_KEY,
  normalizeThemePreference,
  readThemePreference,
  saveThemePreference,
  themeVariables,
} from '../src/themes.js'

const tokenByColor = {
  background: '--dsw-alias-bg-base',
  surface: '--dsw-alias-bg-layer-1',
  raised: '--dsw-alias-bg-layer-2',
  overlay: '--dsw-alias-bg-overlay',
  border: '--dsw-alias-border-l1',
  borderStrong: '--dsw-alias-border-l2',
  text: '--dsw-alias-label-primary',
  muted: '--dsw-alias-label-secondary',
  accent: '--dsw-alias-brand-primary',
  onAccent: '--qibi-on-accent',
  error: '--dsw-alias-state-error-primary',
  success: '--dsw-alias-state-success-primary',
  warning: '--dsw-alias-state-warn-primary',
  idle: '--dsw-alias-state-idle-primary',
  sidebar: '--dsw-specific-sidebar-fill',
}
const previewTokens = {
  '--qibi-preview-bg': 'background',
  '--qibi-preview-text': 'text',
  '--qibi-preview-accent': 'accent',
  '--qibi-preview-on-accent': 'onAccent',
}
const paletteKeys = Object.keys(tokenByColor).sort()
const ids = ['white', 'claude', 'parchment', 'forest', 'dusk', 'rose', 'host']

assert.deepEqual(THEMES.map(({ id }) => id), ids)
assert.ok(Object.isFrozen(THEMES))
assert.deepEqual(DEFAULT_THEME, { theme: 'white', mode: 'light' })
assert.ok(Object.isFrozen(DEFAULT_THEME))
assert.equal(PREFERENCE_KEY, 'qibi:appearance:v1')

const initial = themeVariables(undefined, true)
assert.equal(initial.theme, 'white')
assert.equal(initial.appearance, 'light')
assert.equal(initial.colorScheme, 'light')
assert.match(initial.variables['--dsw-alias-bg-base'], /^#fff(?:fff)?$/i)
assert.equal(initial.variables['--dsw-specific-sidebar-fill'].toLowerCase(), '#fafafa')
assert.ok(luminance(initial.variables['--dsw-alias-brand-primary']) < 0.04)

const whiteDark = themeVariables({ theme: 'white', mode: 'dark' })
assert.ok(luminance(whiteDark.variables['--dsw-alias-bg-base']) > 0)
assert.ok(luminance(whiteDark.variables['--dsw-alias-bg-base']) < 0.08)

const allLocaleKeys = new Set()
const minimums = { text: Infinity, muted: Infinity, 'button label': Infinity, status: Infinity, focus: Infinity }
let paletteCount = 0
for (const preset of THEMES) {
  const { id, nameKey, descriptionKey, light, dark } = preset
  assert.ok(Object.isFrozen(preset), `${id} metadata is read-only`)
  for (const key of [nameKey, descriptionKey]) {
    assert.equal(typeof key, 'string')
    assert.ok(key.length > 0 && !allLocaleKeys.has(key), `${id} has unique locale keys`)
    allLocaleKeys.add(key)
  }
  if (id === 'host') {
    assert.ok(light == null && dark == null, 'host has no palette')
    for (const mode of ['light', 'dark', 'system']) {
      for (const systemDark of [true, false]) {
        assert.deepEqual(themeVariables({ theme: id, mode }, systemDark), {
          variables: {}, colorScheme: 'inherit', theme: 'host', appearance: 'host',
        })
      }
    }
    continue
  }

  for (const [mode, palette] of Object.entries({ light, dark })) {
    paletteCount += 1
    const label = `${id}/${mode}`
    assert.ok(Object.isFrozen(palette), `${label} palette is read-only`)
    assert.deepEqual(Object.keys(palette).sort(), paletteKeys, `${label} palette schema`)
    for (const [color, value] of Object.entries(palette)) {
      assert.match(value, /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i, `${label} ${color} is a safe hex color`)
    }

    const applied = themeVariables({ theme: id, mode }, mode === 'light')
    assert.equal(applied.theme, id)
    assert.equal(applied.appearance, mode)
    assert.equal(applied.colorScheme, mode)
    for (const [color, token] of Object.entries(tokenByColor)) {
      assert.equal(applied.variables[token], palette[color], `${label} maps ${color}`)
    }
    for (const token of Object.keys(applied.variables)) {
      if (Object.hasOwn(previewTokens, token)) {
        assert.equal(applied.variables[token], palette[previewTokens[token]])
      } else {
        assert.ok(Object.values(tokenByColor).includes(token), `${label} unexpected token ${token}`)
      }
    }
    assert.deepEqual(themeVariables({ theme: id, mode: 'system' }, mode === 'dark'), applied)

    for (const surface of ['background', 'surface', 'raised', 'overlay', 'sidebar']) {
      ensureContrast('text', 'text', surface, 4.5)
      ensureContrast('muted', 'muted', surface, 4.5)
      ensureContrast('focus', 'accent', surface, 3)
    }
    ensureContrast('button label', 'onAccent', 'accent', 4.5)
    for (const state of ['error', 'success', 'warning']) {
      for (const surface of ['background', 'surface', 'raised']) {
        ensureContrast('status', state, surface, 4.5)
      }
    }

    function ensureContrast(group, foreground, backdrop, threshold) {
      const a = luminance(palette[foreground])
      const b = luminance(palette[backdrop])
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      assert.ok(ratio >= threshold, `${label} ${foreground} on ${backdrop}: ${ratio.toFixed(2)} < ${threshold}`)
      minimums[group] = Math.min(minimums[group], ratio)
    }
  }
}

assert.equal(themeVariables({ theme: 'dusk', mode: 'system' }).appearance, 'light')
assert.deepEqual(themeVariables({ theme: 'unexpected', mode: 'unexpected' }), initial)
for (const input of [undefined, null, false, 0, '', [], 'rose', {}, { theme: '__proto__', mode: 'toString' }]) {
  assert.deepEqual(normalizeThemePreference(input), DEFAULT_THEME)
}
assert.deepEqual(normalizeThemePreference({ theme: 'rose', mode: 'night' }), { theme: 'rose', mode: 'light' })
assert.deepEqual(normalizeThemePreference({ theme: 'unknown', mode: 'dark' }), { theme: 'white', mode: 'dark' })
assert.deepEqual(normalizeThemePreference({ theme: 'host', mode: 'system', extra: 42 }), { theme: 'host', mode: 'system' })

const stored = new Map([['unrelated', 'keep']])
const storage = {
  getItem(key) { return stored.get(key) ?? null },
  setItem(key, value) { stored.set(key, value) },
}
assert.deepEqual(readThemePreference(storage), DEFAULT_THEME)
for (const corrupt of ['{', 'null', '[]', '"rose"', '{"theme":123,"mode":"bad"}']) {
  stored.set(PREFERENCE_KEY, corrupt)
  assert.deepEqual(readThemePreference(storage), DEFAULT_THEME)
}
const expectedPreference = { theme: 'parchment', mode: 'system' }
assert.deepEqual(saveThemePreference({ ...expectedPreference, extra: 'discard' }, storage), {
  saved: true, preference: expectedPreference,
})
assert.deepEqual(JSON.parse(stored.get(PREFERENCE_KEY)), expectedPreference)
assert.deepEqual(readThemePreference(storage), expectedPreference)
assert.equal(stored.get('unrelated'), 'keep')
assert.deepEqual(saveThemePreference({ theme: 'unknown', mode: 'bad' }, storage), {
  saved: true, preference: DEFAULT_THEME,
})
assert.deepEqual(readThemePreference(storage), DEFAULT_THEME)

function deny() {
  throw new Error('Storage denied')
}

for (const target of [null, {}, { getItem: deny, setItem: deny }]) {
  assert.deepEqual(readThemePreference(target), DEFAULT_THEME)
  assert.deepEqual(saveThemePreference(expectedPreference, target), {
    saved: false, preference: expectedPreference,
  })
}

// Exercise the omitted argument without reaching the process's real localStorage.
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
try {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
  assert.deepEqual(saveThemePreference(expectedPreference), { saved: true, preference: expectedPreference })
  assert.deepEqual(readThemePreference(), expectedPreference)
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: deny })
  assert.deepEqual(readThemePreference(), DEFAULT_THEME)
  assert.deepEqual(saveThemePreference(expectedPreference), { saved: false, preference: expectedPreference })
} finally {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else delete globalThis.localStorage
}

for (const locale of ['zh', 'en']) {
  const pack = JSON.parse(readFileSync(new URL(`../locale/${locale}.json`, import.meta.url), 'utf8'))
  for (const key of [...allLocaleKeys, 'themeOpen', 'themeTitle', 'themeReset', 'themeSaved', 'themeSaveFailed', 'themeModeLight', 'themeModeDark', 'themeModeSystem']) {
    assert.ok(typeof pack.ui[key] === 'string' && pack.ui[key].length > 0, `${locale} missing ${key}`)
  }
}
console.log(`QiBi theme check passed (${paletteCount} palettes, appearance, storage and locale labels)`)
console.log(`Minimum contrast ratios: ${Object.entries(minimums).map(([key, value]) => `${key} ${value.toFixed(2)}:1`).join(', ')}`)

function luminance(hex) {
  let rgb = hex.slice(1)
  if (rgb.length === 3) rgb = [...rgb].map(channel => channel.repeat(2)).join('')
  const [red, green, blue] = rgb.match(/../g).map(channel => {
    const sRGB = Number.parseInt(channel, 16) / 255
    return sRGB <= 0.04045 ? sRGB / 12.92 : ((sRGB + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}
