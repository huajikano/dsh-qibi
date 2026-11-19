import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { DEFAULT_THEME, PREFERENCE_KEY, THEMES, normalizeThemePreference, readThemePreference, saveThemePreference, themeVariables } from './themes.js'
import { DENSITY_KEY, DEFAULT_DENSITY, normalizeDensity, readDensity, saveDensity } from './density.js'

function systemIsDark() {
  try { return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches }
  catch { return false }
}

function Swatches({ palette }) {
  return <span className="qibi-theme-swatches" aria-hidden="true">{['background', 'sidebar', 'text', 'muted', 'accent'].map(key => <span key={key} style={{ backgroundColor: palette[key] }} />)}</span>
}

export function ThemeButton({ appearance, t }) {
  return <button type="button" className="qibi-btn small qibi-theme-trigger" aria-haspopup="dialog" onClick={appearance.open} title={`${t('themeTitle')} · ${appearance.name}`}>
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5.5" stroke="currentColor" /><path d="M8 2.5a5.5 5.5 0 0 0 0 11V2.5Z" fill="currentColor" /></svg>
    {t('themeOpen')}
  </button>
}

function Specimen({ theme, mode, t }) {
  const resolved = themeVariables({ theme: theme.id, mode })
  return <section className="qibi-theme-specimen" style={{ ...resolved.variables, colorScheme: resolved.colorScheme }} aria-label={t(mode === 'dark' ? 'themeDarkPreview' : 'themeLightPreview')}>
    <div className="qibi-theme-specimen-head"><span>{t(mode === 'dark' ? 'themeModeDark' : 'themeModeLight')}</span><span className="qibi-theme-specimen-state">{t('themeSampleSaved')}</span></div>
    <div className="qibi-theme-specimen-prose"><strong>{t('themeSampleHeading')}</strong><p>{t('themeSampleProse')}</p></div>
    <div className="qibi-theme-specimen-actions"><span className="qibi-theme-specimen-tag">{t('themeSampleReference')}</span><span className="qibi-theme-specimen-primary">{t('themeSampleAction')}</span></div>
  </section>
}

/** A live appearance control inside the plugin, not a separate preview page or global theme. */
export function ThemeDialog({ preference, density = DEFAULT_DENSITY, systemDark, feedback, onChange, onDensityChange, onClose, t }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const id = useId()
  const theme = THEMES.find(row => row.id === preference.theme) ?? THEMES[0]
  const current = themeVariables(preference, systemDark)

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const trigger = document.activeElement
    const dialog = dialogRef.current
    dialog?.focus()
    const onKey = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeRef.current()
      } else if (event.key === 'Tab' && dialog) {
        const controls = Array.from(dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]')).filter(node => node.getClientRects().length > 0)
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (!first) { event.preventDefault(); dialog.focus() }
        else if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement))) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      if (trigger?.isConnected && typeof trigger.focus === 'function') trigger.focus()
    }
  }, [])

  return <div className="qibi-overlay qibi-theme-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div ref={dialogRef} className="qibi-dialog qibi-theme-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-hint`} tabIndex={-1}>
      <div className="qibi-dialog-head"><strong id={`${id}-title`}>{t('themeTitle')}</strong><span className="qibi-spacer" /><button type="button" className="qibi-btn small" onClick={onClose} aria-label={t('close')}>×</button></div>
      <div className="qibi-theme-content">
        <fieldset className="qibi-theme-options"><legend>{t('themePresets')}</legend>{THEMES.map(row => {
          const palette = row.light && row.dark ? row[current.appearance === 'dark' ? 'dark' : 'light'] : null
          return <label key={row.id} className={`qibi-theme-option${row.id === preference.theme ? ' selected' : ''}`}>
            <input type="radio" name={`${id}-theme`} value={row.id} checked={row.id === preference.theme} onChange={() => onChange({ ...preference, theme: row.id })} />
            <span className="qibi-theme-option-content">{palette ? <Swatches palette={palette} /> : <span className="qibi-theme-host-mark" aria-hidden="true">DSH</span>}<span className="qibi-theme-option-name">{t(row.nameKey)}{row.id === 'white' && <span className="qibi-theme-default">{t('themeDefault')}</span>}</span></span>
          </label>
        })}</fieldset>
        <div className="qibi-theme-details">
          <h3>{t(theme.nameKey)}</h3><p className="qibi-sub">{t(theme.descriptionKey)}</p>
          <fieldset className="qibi-theme-mode-options" disabled={preference.theme === 'host'}><legend>{t('themeAppearance')}</legend>{['light', 'dark', 'system'].map(mode => <label key={mode} className={`qibi-theme-mode${preference.mode === mode ? ' selected' : ''}`}><input type="radio" name={`${id}-mode`} value={mode} checked={preference.mode === mode} onChange={() => onChange({ ...preference, mode })} />{t(`themeMode${mode[0].toUpperCase()}${mode.slice(1)}`)}</label>)}</fieldset>
          {preference.theme === 'host' ? <div className="qibi-card qibi-theme-host-hint">{t('themeHostHint')}</div> : <div className="qibi-theme-specimens"><Specimen theme={theme} mode="light" t={t} /><Specimen theme={theme} mode="dark" t={t} /></div>}
          <fieldset className="qibi-theme-mode-options qibi-density-options"><legend>{t('densityTitle')}</legend>{['comfortable', 'compact'].map(value => <label key={value} className={`qibi-theme-mode${density === value ? ' selected' : ''}`}><input type="radio" name={`${id}-density`} value={value} checked={density === value} onChange={() => onDensityChange?.(value)} />{t(value === 'comfortable' ? 'densityComfortable' : 'densityCompact')}</label>)}</fieldset>
          <p className="qibi-sub">{t(density === 'comfortable' ? 'densityComfortableHint' : 'densityCompactHint')}</p>
          <p className="qibi-sub" id={`${id}-hint`}>{t('themeScopeHint')}</p>
          <p className={`qibi-sub${feedback === 'failed' ? ' qibi-theme-save-error' : ''}`} role="status" aria-live="polite">{feedback === 'failed' ? t('themeSaveFailed') : feedback === 'saved' ? t('themeSaved') : t('themeInstantHint')}</p>
        </div>
      </div>
      <div className="qibi-dialog-foot"><button type="button" className="qibi-btn" onClick={() => onChange(DEFAULT_THEME)}>{t('themeReset')}</button><span className="qibi-spacer" /><button type="button" className="qibi-btn primary" onClick={onClose}>{t('themeDone')}</button></div>
    </div>
  </div>
}

/** Owns appearance only. The same Workbench element remains mounted across every theme change. */
export function AppearanceFrame({ t, children }) {
  const [preference, setPreference] = useState(readThemePreference)
  const [density, setDensity] = useState(readDensity)
  const [systemDark, setSystemDark] = useState(systemIsDark)
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState('idle')
  const resolved = themeVariables(preference, systemDark)
  const openDialog = useCallback(() => { setFeedback('idle'); setOpen(true) }, [])
  const closeDialog = useCallback(() => setOpen(false), [])
  const change = useCallback(next => {
    const result = saveThemePreference(next)
    setPreference(result.preference)
    setFeedback(result.saved ? 'saved' : 'failed')
  }, [])

  const changeDensity = useCallback(value => {
    const result = saveDensity(value)
    setDensity(result.density)
    setFeedback(result.saved ? 'saved' : 'failed')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    let media
    try { media = window.matchMedia('(prefers-color-scheme: dark)') } catch { return undefined }
    const update = () => setSystemDark(media.matches)
    update()
    if (typeof media.addEventListener === 'function') { media.addEventListener('change', update); return () => media.removeEventListener('change', update) }
    media.addListener?.(update)
    return () => media.removeListener?.(update)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const update = event => {
      if (event.key === DENSITY_KEY) { setDensity(normalizeDensity(event.newValue)); return }
      if (event.key !== PREFERENCE_KEY && event.key !== null) return
      if (event.key === null) setDensity(DEFAULT_DENSITY)
      let next = DEFAULT_THEME
      if (event.key !== null && event.newValue !== null) {
        try { next = normalizeThemePreference(JSON.parse(event.newValue)) } catch { /* Keep the explicit white fallback. */ }
      }
      setPreference(next)
    }
    window.addEventListener('storage', update)
    return () => window.removeEventListener('storage', update)
  }, [])

  const theme = THEMES.find(row => row.id === preference.theme) ?? THEMES[0]
  return <div className="qibi-theme-scope" data-qibi-theme={resolved.theme} data-qibi-appearance={resolved.appearance} data-qibi-density={density} style={{ ...resolved.variables, colorScheme: resolved.colorScheme }}>
    {children({ open: openDialog, name: t(theme.nameKey), preference })}
    {open && <ThemeDialog preference={preference} density={density} systemDark={systemDark} feedback={feedback} onChange={change} onDensityChange={changeDensity} onClose={closeDialog} t={t} />}
  </div>
}
