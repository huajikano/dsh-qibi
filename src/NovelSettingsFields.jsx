import React, { useEffect, useId, useRef } from 'react'
import { NOVEL_GENRES, NOVEL_STATUSES } from './novel-settings.js'

function SettingField({ label, hint, children }) {
  return <label className="qibi-field"><span className="qibi-label">{label}</span>{children}{hint && <span className="qibi-sub qibi-setting-hint">{hint}</span>}</label>
}

/** The surrounding Dialog owns focus, dismissal and the permanent action footer. */
export default function NovelSettingsFields({ form, initial, formId, mode, writable, busy, error, onField, onSubmit, onDelete, t }) {
  const listId = useId()
  const titleRef = useRef(null)
  const locked = busy || !writable
  const titleInvalid = Boolean(error) && !form.title.trim()
  useEffect(() => { if (titleInvalid && !locked) titleRef.current?.focus() }, [titleInvalid, locked])
  const set = (key, value) => { if (!locked) onField(key, value) }
  const submit = event => {
    event.preventDefault()
    if (!locked) void onSubmit()
  }
  return <div className="qibi-novel-settings">
    <div className="qibi-settings-context">
      <span className="qibi-settings-bookmark" aria-hidden="true"><svg viewBox="0 0 20 24" width="20" height="24" fill="none"><path d="M3 2h14v20l-7-4-7 4V2Z" stroke="currentColor" strokeWidth="1.3" /><path d="M7 7h6M7 11h4" stroke="currentColor" strokeWidth="1.3" /></svg></span>
      <div><strong>{mode === 'create' ? t('novelCreateLead') : initial?.title || t('untitled')}</strong><p className="qibi-sub">{t(mode === 'create' ? 'novelCreateHint' : 'novelSettingsHint')}</p></div>
      {mode === 'edit' && <span className="qibi-tag">{Number(initial?.chapterCount ?? 0).toLocaleString()} {t('chapters')} · {Number(initial?.wordCount ?? 0).toLocaleString()} {t('words')}</span>}
    </div>
    {!writable && <p className="qibi-sub" role="status">{t('novelReadOnlyHint')}</p>}
    <form id={formId} className="qibi-settings-form" noValidate onSubmit={submit} onKeyDown={event => {
      if (event.isComposing || event.nativeEvent?.isComposing) return
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); if (!locked) void onSubmit() }
    }}>
      <section className="qibi-settings-section" aria-labelledby={`${listId}-basic`}>
        <div className="qibi-settings-section-head"><h3 id={`${listId}-basic`}>{t('novelBasicSection')}</h3><span className="qibi-sub">{t('novelRequiredHint')}</span></div>
        <SettingField label={`${t('novelTitle')} *`}>
          <input ref={titleRef} className="qibi-input" name="title" autoComplete="off" required aria-invalid={titleInvalid || undefined} aria-describedby={titleInvalid ? `${listId}-error` : undefined} readOnly={!writable} disabled={busy} value={form.title} placeholder={t('novelTitlePlaceholder')} onChange={event => set('title', event.target.value)} />
        </SettingField>
        <div className="qibi-settings-grid">
          <SettingField label={t('novelAuthor')} hint={t('novelAuthorHint')}><input className="qibi-input" name="author" readOnly={!writable} disabled={busy} value={form.author} onChange={event => set('author', event.target.value)} placeholder={t('novelAuthorPlaceholder')} /></SettingField>
          <SettingField label={t('novelGenre')} hint={t('novelCustomValueHint')}><input className="qibi-input" name="genre" list={`${listId}-genres`} readOnly={!writable} disabled={busy} value={form.genre} onChange={event => set('genre', event.target.value)} placeholder={t('novelGenrePlaceholder')} /><datalist id={`${listId}-genres`}>{NOVEL_GENRES.map(value => <option key={value} value={value} />)}</datalist></SettingField>
          <SettingField label={t('novelStatus')} hint={t('novelCustomValueHint')}><input className="qibi-input" name="status" list={`${listId}-statuses`} readOnly={!writable} disabled={busy} value={form.status} onChange={event => set('status', event.target.value)} /><datalist id={`${listId}-statuses`}>{NOVEL_STATUSES.map(value => <option key={value} value={value} />)}</datalist></SettingField>
        </div>
      </section>
      <section className="qibi-settings-section" aria-labelledby={`${listId}-intro`}>
        <div className="qibi-settings-section-head"><h3 id={`${listId}-intro`}>{t('novelIntroSection')}</h3><span className="qibi-sub">{form.intro.length.toLocaleString()} {t('charactersCount')}</span></div>
        <SettingField label={t('novelIntro')} hint={t('novelIntroHint')}><textarea className="qibi-textarea qibi-novel-intro" name="intro" rows={7} readOnly={!writable} disabled={busy} value={form.intro} placeholder={t('novelIntroPlaceholder')} onChange={event => set('intro', event.target.value)} /></SettingField>
      </section>
      {error && <div className="qibi-error-text qibi-settings-error" id={`${listId}-error`} role="alert">{error}</div>}
    </form>
    {mode === 'edit' && <details className="qibi-settings-danger">
      <summary>{t('novelDangerSection')}</summary>
      <p className="qibi-sub">{t('novelDeleteHint')}</p>
      <button type="button" className="qibi-btn danger" disabled={locked} onClick={() => { if (!locked) void onDelete() }}>{t('novelDeleteAction')}</button>
    </details>}
  </div>
}
