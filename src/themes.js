// Theme colors belong to the QiBi workbench wrapper. The host option leaves
// every color token to the surrounding DSH theme.
export const DEFAULT_THEME = Object.freeze({ theme: 'white', mode: 'light' })
export const PREFERENCE_KEY = 'qibi:appearance:v1'

const lightStatus = { error: '#9d313d', success: '#286044', warning: '#795018' }
const darkStatus = { error: '#ffa7ab', success: '#8bd1a1', warning: '#ecc383' }

function preset(id, light, dark) {
  const key = `theme${id[0].toUpperCase()}${id.slice(1)}`
  return Object.freeze({
    id,
    nameKey: `${key}Name`,
    descriptionKey: `${key}Description`,
    light: light ? Object.freeze({ ...lightStatus, ...light }) : null,
    dark: dark ? Object.freeze({ ...darkStatus, ...dark }) : null,
  })
}

export const THEMES = Object.freeze([
  preset('white', {
    background: '#ffffff', surface: '#fafafa', raised: '#f0f0f0', overlay: '#fdfdfd', sidebar: '#fafafa',
    border: '#dddddd', borderStrong: '#acacad',
    text: '#222222', muted: '#595a5c', idle: '#68696b',
    accent: '#1e1e1e', onAccent: '#ffffff',
  }, {
    background: '#202122', surface: '#292a2b', raised: '#333435', overlay: '#2e2f30', sidebar: '#252627',
    border: '#454648', borderStrong: '#696b6e',
    text: '#ebebea', muted: '#b4b5b7', idle: '#a5a6a8',
    accent: '#dededc', onAccent: '#242525',
  }),
  preset('claude', {
    background: '#f5f3ef', surface: '#efebe6', raised: '#e8e2db', overlay: '#fcfaf7', sidebar: '#eeebe6',
    border: '#d8cfc5', borderStrong: '#ab9d8f',
    text: '#302923', muted: '#61574d', idle: '#6a5d50',
    accent: '#934a2d', onAccent: '#fff8ef',
  }, {
    background: '#272421', surface: '#302c27', raised: '#3b342d', overlay: '#362f29', sidebar: '#2d2824',
    border: '#51463d', borderStrong: '#7b6b5d',
    text: '#f3e9df', muted: '#c5b6a7', idle: '#b3a28f',
    accent: '#e5a383', onAccent: '#36241d',
  }),
  preset('parchment', {
    background: '#faf2dc', surface: '#f3e9cd', raised: '#ebdfbe', overlay: '#fff7e5', sidebar: '#f0e6ca',
    border: '#d7c8a4', borderStrong: '#aa9469',
    text: '#382d1e', muted: '#61543c', idle: '#6a593b',
    accent: '#755223', onAccent: '#fff5dd',
  }, {
    background: '#29261e', surface: '#322d22', raised: '#3d3528', overlay: '#373025', sidebar: '#2e291e',
    border: '#534837', borderStrong: '#7d6b50',
    text: '#f2e6c9', muted: '#c6b697', idle: '#b7a47e',
    accent: '#d9b477', onAccent: '#332615',
  }),
  preset('forest', {
    background: '#f3f7f1', surface: '#ebf1e8', raised: '#e0eadf', overlay: '#fafcf8', sidebar: '#e8efe6',
    border: '#cbd8ca', borderStrong: '#96ab98',
    text: '#24342b', muted: '#485d50', idle: '#526656',
    accent: '#32614c', onAccent: '#f4fff7',
  }, {
    background: '#202924', surface: '#27322b', raised: '#303e35', overlay: '#2b382f', sidebar: '#242e28',
    border: '#425247', borderStrong: '#657d6c',
    text: '#e6f0e7', muted: '#afc4b5', idle: '#9cb1a1',
    accent: '#93c9aa', onAccent: '#1f3227',
  }),
  preset('dusk', {
    background: '#f4f2fa', surface: '#eeebf6', raised: '#e6e1f1', overlay: '#faf8ff', sidebar: '#ece8f5',
    border: '#d4cce4', borderStrong: '#a99bbc',
    text: '#2d283a', muted: '#59536b', idle: '#655c77',
    accent: '#604f91', onAccent: '#faf6ff',
  }, {
    background: '#252430', surface: '#2d2b39', raised: '#373447', overlay: '#322f40', sidebar: '#292736',
    border: '#4a455e', borderStrong: '#6f6787',
    text: '#ede9f6', muted: '#c0b6d0', idle: '#aba1bd',
    accent: '#bca9e8', onAccent: '#2e2543',
  }),
  preset('rose', {
    background: '#faf1f2', surface: '#f7eaed', raised: '#f1e0e5', overlay: '#fff8f9', sidebar: '#f4e6eb',
    border: '#e1ccd2', borderStrong: '#bb9ba7',
    text: '#382932', muted: '#654f5b', idle: '#715867',
    accent: '#963b5b', onAccent: '#fff5f8',
  }, {
    background: '#2a2328', surface: '#33282f', raised: '#402e38', overlay: '#392b33', sidebar: '#2e252b',
    border: '#58424e', borderStrong: '#826370',
    text: '#f4e8ed', muted: '#ccafbe', idle: '#bda0ad',
    accent: '#e7a2bd', onAccent: '#3e2332',
  }),
  preset('host'),
])

const themesById = new Map(THEMES.map(theme => [theme.id, theme]))
const modes = new Set(['light', 'dark', 'system'])

export function normalizeThemePreference(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return { ...DEFAULT_THEME }
  const { theme, mode } = input
  return {
    theme: themesById.has(theme) ? theme : DEFAULT_THEME.theme,
    mode: modes.has(mode) ? mode : DEFAULT_THEME.mode,
  }
}

export function readThemePreference(storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage
    const value = target?.getItem(PREFERENCE_KEY)
    if (typeof value === 'string') return normalizeThemePreference(JSON.parse(value))
  } catch {
    // Storage access and malformed JSON both fall back to the defaults.
  }
  return { ...DEFAULT_THEME }
}

export function saveThemePreference(pref, storage) {
  const preference = normalizeThemePreference(pref)
  try {
    const target = storage === undefined ? globalThis.localStorage : storage
    target.setItem(PREFERENCE_KEY, JSON.stringify(preference))
    return { saved: true, preference }
  } catch {
    return { saved: false, preference }
  }
}

export function themeVariables(pref, systemDark = false) {
  const { theme, mode } = normalizeThemePreference(pref)
  if (theme === 'host') return { variables: {}, colorScheme: 'inherit', theme, appearance: 'host' }

  const appearance = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode
  const palette = themesById.get(theme)[appearance]
  return {
    theme,
    appearance,
    colorScheme: appearance,
    variables: {
      '--dsw-alias-bg-base': palette.background,
      '--dsw-alias-bg-layer-1': palette.surface,
      '--dsw-alias-bg-layer-2': palette.raised,
      '--dsw-alias-bg-overlay': palette.overlay,
      '--dsw-alias-border-l1': palette.border,
      '--dsw-alias-border-l2': palette.borderStrong,
      '--dsw-alias-brand-primary': palette.accent,
      '--dsw-alias-label-primary': palette.text,
      '--dsw-alias-label-secondary': palette.muted,
      '--dsw-alias-state-error-primary': palette.error,
      '--dsw-alias-state-idle-primary': palette.idle,
      '--dsw-alias-state-success-primary': palette.success,
      '--dsw-alias-state-warn-primary': palette.warning,
      '--dsw-specific-sidebar-fill': palette.sidebar,
      '--qibi-on-accent': palette.onAccent,
      '--qibi-preview-bg': palette.background,
      '--qibi-preview-text': palette.text,
      '--qibi-preview-accent': palette.accent,
      '--qibi-preview-on-accent': palette.onAccent,
    },
  }
}
