import React, { useEffect, useId, useRef, useState } from 'react'

const errorText = cause => cause instanceof Error ? cause.message : String(cause ?? '')
const sameId = (left, right) => left != null && right != null && String(left) === String(right)
const targetValue = chapterId => chapterId == null ? '' : String(chapterId)
const draftKey = draft => JSON.stringify([draft.title, draft.content, draft.chapterId])
const emptyState = context => ({ context, outline: null, editor: null, selectedId: null, busy: false, loading: false, loadError: null, formError: null })
const editorFrom = row => {
  const editor = { id: row.id, title: row.title ?? '', content: row.content ?? '', chapterId: targetValue(row.chapterId), token: row.token ?? null, conflict: false }
  return { ...editor, baseline: draftKey(editor) }
}
const previewText = content => {
  const characters = Array.from(String(content ?? '').replace(/\s+/g, ' ').trim())
  return characters.length > 180 ? characters.slice(0, 179).join('') + '…' : characters.join('')
}

/** Outline CRUD without changing manuscript content or the shared service contract. */
export default function OutlineWorkspace({ call, novelId, chapters = [], chapterId, writable, active, notify = () => {}, t = key => key, registerGuard }) {
  // A fresh identity is created during render, before old requests can settle.
  const contextRef = useRef(null)
  if (!contextRef.current || !Object.is(contextRef.current.novelId, novelId)) {
    contextRef.current = { novelId, alive: true, busy: false, listSeq: 0 }
  }
  const context = contextRef.current
  const [stored, setStored] = useState(() => emptyState(context))
  const state = stored.context === context ? stored : emptyState(context)
  const stateRef = useRef(state)
  stateRef.current = state
  const accessRef = useRef(writable)
  accessRef.current = writable
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const ids = useId()
  const titleInputRef = useRef(null)
  const readerInputRef = useRef(null)
  const pendingFocus = useRef(null)
  const [focusEpoch, setFocusEpoch] = useState(0)
  const requestFocus = target => { pendingFocus.current = target; setFocusEpoch(value => value + 1) }
  useEffect(() => {
    if (!active || !pendingFocus.current) return
    const element = pendingFocus.current === 'reader' ? readerInputRef.current : titleInputRef.current
    if (!element) return
    pendingFocus.current = null
    element.focus({ preventScroll: true })
    element.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
  }, [context, active, focusEpoch])
  const current = () => contextRef.current === context && context.alive
  const commit = changes => {
    if (!current()) return
    const previous = stateRef.current.context === context ? stateRef.current : emptyState(context)
    const next = { ...previous, ...(typeof changes === 'function' ? changes(previous) : changes) }
    // Keep callbacks from the same render current before React paints again.
    stateRef.current = next
    setStored(next)
  }
  const dirty = editor => !!editor && draftKey(editor) !== editor.baseline
  const confirmDiscard = () => !dirty(stateRef.current.editor) || window.confirm(t('outlineDiscardConfirm'))
  const canNavigate = () => current() && !context.busy
  const lock = () => {
    if (!canNavigate()) return false
    context.busy = true
    // A list request started before a mutation must not undo its returned list.
    context.listSeq++
    commit({ busy: true, loading: false })
    return true
  }
  const unlock = () => {
    if (!current()) return
    context.busy = false
    commit({ busy: false })
  }

  const load = async () => {
    if (!current() || context.busy || novelId == null) return
    const sequence = ++context.listSeq
    commit({ loading: true })
    try {
      const result = await call('outline', { novelId })
      if (!current() || sequence !== context.listSeq) return
      commit({ outline: result.outline, loadError: null })
    } catch (cause) {
      if (current() && sequence === context.listSeq) commit({ loadError: errorText(cause) })
    } finally {
      if (current() && sequence === context.listSeq) commit({ loading: false })
    }
  }

  useEffect(() => {
    context.alive = true
    setStored(previous => previous.context === context ? previous : emptyState(context))
    setFilter('all')
    setSearch('')
    return () => { context.alive = false }
  }, [context])

  useEffect(() => {
    if (active) void load()
    // Loading can refresh the list, but never replaces a local editor or its token.
  }, [context, active, call])

  useEffect(() => {
    if (!registerGuard) return
    return registerGuard(() => {
      if (!current()) return true
      if (context.busy) return false
      return !dirty(stateRef.current.editor) || window.confirm(t('outlineDiscardChanges'))
    })
    // The guard approves leaving only. The parent owns the eventual transition.
  }, [registerGuard, context, t])

  const startNew = target => {
    if (!accessRef.current || !canNavigate() || !confirmDiscard()) return
    const editor = editorFrom({ id: 'new', title: '', content: '', chapterId: target })
    commit({ editor, selectedId: null, formError: null })
    requestFocus('title')
  }
  const read = row => {
    if (!canNavigate()) return
    if (sameId(stateRef.current.selectedId, row.id) && !stateRef.current.editor) { requestFocus('reader'); return }
    if (!confirmDiscard()) return
    commit({ editor: null, selectedId: row.id, formError: null })
    requestFocus('reader')
  }
  const edit = row => {
    if (!accessRef.current || !canNavigate()) return
    if (sameId(stateRef.current.editor?.id, row.id)) { requestFocus('title'); return }
    if (!confirmDiscard()) return
    commit({ editor: editorFrom(row), selectedId: row.id, formError: null })
    requestFocus('title')
  }
  const cancel = () => {
    if (!canNavigate() || !confirmDiscard()) return
    commit({ editor: null, formError: null })
  }
  const changeDraft = (field, value) => {
    if (!accessRef.current || !canNavigate() || !stateRef.current.editor) return
    commit(previous => ({ editor: { ...previous.editor, [field]: value }, formError: null }))
  }

  const save = async () => {
    if (!accessRef.current || !canNavigate()) return
    const editor = stateRef.current.editor
    if (!editor) return
    if (!editor.title.trim() && !editor.content.trim()) {
      commit({ formError: t('outlineNeedsText') })
      return
    }
    // An old/deleted target is visible for recovery, never silently reassigned.
    if (editor.chapterId !== '' && !chapters.some(row => sameId(row.id, editor.chapterId))) {
      commit({ formError: t('outlineTargetMissing') })
      return
    }
    if (!lock()) return
    commit({ formError: null })
    try {
      const target = editor.chapterId === '' ? null : Number(editor.chapterId)
      const result = editor.id === 'new'
        ? await call('createOutline', { novelId, title: editor.title, content: editor.content, chapterId: target })
        : await call('updateOutline', { outlineId: editor.id, title: editor.title, content: editor.content, chapterId: target, expectedToken: editor.token ?? undefined })
      if (!current()) return
      // The mutation response is authoritative. Close create before any future
      // list refresh, so a failed refresh cannot offer a duplicate create retry.
      commit({ outline: result.outline, editor: null, selectedId: editor.id === 'new' ? result.id : editor.id, formError: null, loadError: null })
      notify('info', t('savedNotice'))
    } catch (cause) {
      if (!current()) return
      if (cause?.code === 'ENTITY_CONFLICT') {
        commit(previous => ({ editor: { ...previous.editor, conflict: true }, formError: null }))
      } else {
        commit({ formError: errorText(cause) })
      }
    } finally {
      unlock()
    }
  }

  const reloadEditor = async () => {
    if (!canNavigate()) return
    const editor = stateRef.current.editor
    if (!editor || editor.id === 'new' || !window.confirm(t('outlineReloadConfirm')) || !lock()) return
    try {
      const result = await call('outline', { novelId })
      if (!current()) return
      const row = result.outline.find(item => sameId(item.id, editor.id))
      if (!row) {
        commit({ outline: result.outline, formError: t('outlineEntryMissing'), loadError: null })
        return
      }
      commit({ outline: result.outline, editor: editorFrom(row), formError: null, loadError: null })
    } catch (cause) {
      if (current()) commit({ formError: errorText(cause) })
    } finally {
      unlock()
    }
  }

  const remove = async row => {
    if (!accessRef.current || !canNavigate()) return
    if (sameId(stateRef.current.editor?.id, row.id) && !confirmDiscard()) return
    if (!window.confirm(t('confirmDeleteOutline')) || !lock()) return
    try {
      const result = await call('deleteOutline', { outlineId: row.id })
      if (!current()) return
      commit(previous => ({
        outline: result.outline,
        editor: sameId(previous.editor?.id, row.id) ? null : previous.editor,
        selectedId: sameId(previous.selectedId, row.id) ? null : previous.selectedId,
        loadError: null,
      }))
      notify('info', t('deletedNotice'))
    } catch (cause) {
      if (current()) notify('error', errorText(cause))
    } finally {
      unlock()
    }
  }

  const formKeyDown = event => {
    event.stopPropagation()
    if (event.isComposing || event.nativeEvent?.isComposing) return
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      return save()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
    }
  }
  const chapterLabel = id => chapters.find(row => sameId(row.id, id))?.title ?? `#${id}`
  const chapterOrder = new Map(chapters.map((row, index) => [String(row.id), index]))
  const sorted = [...(state.outline ?? [])].sort((left, right) => {
    const order = row => row.chapterId == null ? -1 : chapterOrder.get(String(row.chapterId)) ?? chapters.length
    return order(left) - order(right)
  })
  const query = search.trim().toLocaleLowerCase()
  const visible = sorted.filter(row => {
    const matchesTarget = filter === 'all' || (filter === 'master' && row.chapterId == null) ||
      (filter === 'current' && chapterId != null && sameId(row.chapterId, chapterId)) ||
      (filter.startsWith('chapter:') && sameId(row.chapterId, filter.slice(8)))
    return matchesTarget && (!query || `${row.title ?? ''}\n${row.content ?? ''}`.toLocaleLowerCase().includes(query))
  })
  const groups = []
  for (const row of visible) {
    const key = row.chapterId == null ? 'master' : String(row.chapterId)
    let group = groups.find(item => item.key === key)
    if (!group) { group = { key, label: row.chapterId == null ? t('outlineMaster') : chapterLabel(row.chapterId), rows: [] }; groups.push(group) }
    group.rows.push(row)
  }
  const editor = state.editor
  const selected = (state.outline ?? []).find(row => sameId(row.id, state.selectedId))
  const currentChapter = chapters.find(row => sameId(row.id, chapterId))
  const canWrite = !!writable && !state.busy
  const missingTarget = editor && editor.chapterId !== '' && !chapters.some(row => sameId(row.id, editor.chapterId))

  return <div className="qibi-pane qibi-outline-workspace" aria-busy={state.busy || state.loading} onKeyDown={event => event.stopPropagation()}>
    <header className="qibi-outline-header">
      <div><h2 className="qibi-outline-heading">{t('tabOutline')}</h2><p className="qibi-sub">{t('outlineWorkspaceHint')}</p></div>
      <div className="qibi-actions qibi-outline-create-actions">
        <button type="button" className="qibi-btn small" disabled={!canWrite} onClick={() => startNew(null)}>{t('outlineNewMaster')}</button>
        <button type="button" className="qibi-btn small" disabled={!canWrite || chapters.length === 0} onClick={() => startNew(currentChapter?.id ?? chapters[0]?.id)}>{t('outlineNewChapter')}</button>
      </div>
    </header>
    {!writable && <p className="qibi-sub qibi-outline-readonly" role="status">{t('outlineReadOnlyHint')}</p>}
    <div className="qibi-outline-columns">
      <section className="qibi-outline-editor" aria-labelledby={`${ids}-editor`}>
        {editor ? <form className="qibi-form qibi-outline-form" onSubmit={event => { event.preventDefault(); event.stopPropagation(); return save() }} onKeyDown={formKeyDown}>
          <div className="qibi-row"><h3 id={`${ids}-editor`}>{t(editor.id === 'new' ? 'outlineCreateHeading' : 'outlineEditHeading')}</h3><span className="qibi-spacer" /><span className="qibi-sub" role="status">{t(state.busy ? 'outlineWorking' : dirty(editor) ? 'outlineDraftUnsaved' : 'outlineDraftUnchanged')}</span></div>
          <fieldset className="qibi-form-lock qibi-outline-fields" disabled={state.busy}>
            <label className="qibi-field" htmlFor={`${ids}-target`}><span className="qibi-label">{t('outlineTarget')}</span>
              <select id={`${ids}-target`} name="outline-target" className="qibi-select" value={editor.chapterId} disabled={!canWrite} onChange={event => changeDraft('chapterId', event.target.value)}>
                <option value="">{t('outlineMaster')}</option>
                {missingTarget && <option value={editor.chapterId}>{chapterLabel(editor.chapterId)} · {t('outlineTargetUnavailable')}</option>}
                {chapters.map(row => <option key={row.id} value={String(row.id)}>{row.title}</option>)}
              </select>
            </label>
            <label className="qibi-field" htmlFor={`${ids}-title`}><span className="qibi-label">{t('outlineTitle')}</span>
              <input ref={titleInputRef} id={`${ids}-title`} name="outline-title" className="qibi-input" value={editor.title} readOnly={!writable} disabled={state.busy} aria-describedby={`${ids}-form-hint`} aria-invalid={!!state.formError} onChange={event => changeDraft('title', event.target.value)} />
            </label>
            <label className="qibi-field" htmlFor={`${ids}-content`}><span className="qibi-label">{t('outlineContent')}</span>
              <textarea id={`${ids}-content`} name="outline-content" className="qibi-textarea qibi-outline-textarea" rows={12} value={editor.content} readOnly={!writable} disabled={state.busy} aria-describedby={`${ids}-form-hint`} aria-invalid={!!state.formError} onChange={event => changeDraft('content', event.target.value)} />
            </label>
          </fieldset>
          <p id={`${ids}-form-hint`} className="qibi-sub">{t('outlineFormHint')}</p>
          {editor.conflict && <div className="qibi-outline-conflict" role="alert">{t('outlineConflictHint')}</div>}
          {state.formError && <div className="qibi-outline-error" role="alert">{state.formError}</div>}
          <div className="qibi-actions qibi-outline-form-actions">
            <button type="button" className="qibi-btn small primary" disabled={!canWrite} onClick={save}>{t('save')}</button>
            <button type="button" className="qibi-btn small" disabled={state.busy} onClick={cancel}>{t('cancel')}</button>
            {editor.id !== 'new' && <button type="button" className="qibi-btn small qibi-outline-reload" disabled={state.busy} onClick={reloadEditor}>{t('outlineReloadDiscard')}</button>}
          </div>
        </form> : selected ? <div className="qibi-outline-reader">
          <div className="qibi-row"><h3 id={`${ids}-editor`}>{selected.title || t('untitled')}</h3><span className="qibi-spacer" /><button type="button" className="qibi-btn small" disabled={!canWrite} onClick={() => edit(selected)}>{t('edit')}</button></div>
          <p className="qibi-sub">{selected.chapterId == null ? t('outlineMaster') : chapterLabel(selected.chapterId)}</p>
          <label className="qibi-field" htmlFor={`${ids}-reader`}><span className="qibi-label">{t('outlineContent')}</span><textarea ref={readerInputRef} id={`${ids}-reader`} name="outline-reader" className="qibi-textarea qibi-outline-textarea" rows={12} readOnly disabled={state.busy} value={selected.content ?? ''} /></label>
        </div> : <div className="qibi-empty qibi-outline-reader-empty"><h3 id={`${ids}-editor`}>{t('outlineSelectHeading')}</h3><span>{t('outlineSelectHint')}</span></div>}
      </section>
      <section className="qibi-outline-list" aria-labelledby={`${ids}-list`}>
        <div className="qibi-outline-list-heading"><h3 id={`${ids}-list`}>{t('outlineEntries')}</h3><span className="qibi-sub qibi-outline-count" role="status">{visible.length} / {state.outline?.length ?? 0} {t('outlineCountUnit')}</span></div>
        <div className="qibi-outline-filters">
          <label className="qibi-field" htmlFor={`${ids}-filter`}><span className="qibi-label">{t('outlineFilter')}</span><select id={`${ids}-filter`} name="outline-filter" className="qibi-select" value={filter} disabled={state.busy} onChange={event => { if (canNavigate()) setFilter(event.target.value) }}>
            <option value="all">{t('outlineFilterAll')}</option><option value="master">{t('outlineMaster')}</option><option value="current" disabled={!currentChapter}>{t('outlineFilterCurrent')}</option>
            {chapters.map(row => <option key={row.id} value={`chapter:${row.id}`}>{row.title}</option>)}
          </select></label>
          <label className="qibi-field" htmlFor={`${ids}-search`}><span className="qibi-label">{t('outlineSearch')}</span><input id={`${ids}-search`} name="outline-search" type="search" className="qibi-input" value={search} disabled={state.busy} placeholder={t('outlineSearchHint')} onChange={event => { if (canNavigate()) setSearch(event.target.value) }} /></label>
          <button type="button" className="qibi-btn small qibi-outline-refresh" disabled={state.busy} onClick={load}>{t('outlineRefresh')}</button>
        </div>
        {state.loadError && <div className="qibi-outline-error" role="alert"><strong>{t('loadFailed')}</strong><p>{state.loadError}</p><button type="button" className="qibi-btn small" disabled={state.busy} onClick={load}>{t('retry')}</button></div>}
        {state.loading && <p className="qibi-sub" role="status">{t('loading')}</p>}
        {state.outline !== null && visible.length === 0 && <div className="qibi-empty"><strong>{t(state.outline.length === 0 ? 'emptyOutline' : 'outlineNoMatches')}</strong><span>{t(state.outline.length === 0 ? 'emptyOutlineHint' : 'outlineNoMatchesHint')}</span></div>}
        {groups.map(group => <section key={group.key} className="qibi-outline-group" aria-label={group.label}>
          <h4 className="qibi-outline-group-heading">{group.label}</h4>
          {group.rows.map(row => <article key={row.id} data-outline-id={row.id} className={`qibi-card qibi-outline-card${sameId(state.selectedId, row.id) ? ' qibi-outline-card-selected' : ''}`}>
            <div className="qibi-outline-card-heading"><h4>{row.title || t('untitled')}</h4><span className="qibi-tag">{group.label}</span></div>
            <p className="qibi-outline-preview">{previewText(row.content) || '—'}</p>
            <div className="qibi-actions qibi-outline-card-actions">
              <button type="button" data-outline-action="read" className="qibi-btn small" disabled={state.busy} aria-expanded={sameId(state.selectedId, row.id) && !editor} aria-controls={`${ids}-editor`} onClick={() => read(row)}>{t('outlineReadFull')}</button>
              <button type="button" data-outline-action="edit" className="qibi-btn small" disabled={!canWrite} onClick={() => edit(row)}>{t('edit')}</button>
              <button type="button" data-outline-action="delete" className="qibi-btn small danger qibi-outline-delete" disabled={!canWrite} onClick={() => remove(row)}>{t('delete')}</button>
            </div>
          </article>)}
        </section>)}
      </section>
    </div>
  </div>
}
