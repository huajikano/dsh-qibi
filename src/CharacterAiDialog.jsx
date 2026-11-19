import React, { useEffect, useId, useRef, useState } from 'react'
import { CHARACTER_FIELDS as FIELDS, CHARACTER_IMPORT_LIMIT, candidateFields, characterNameKey, mergeCharacterCandidates, validRangeSource } from './character-batches.js'

const FIELD_KEYS = Object.fromEntries(FIELDS.map(field => [field, `characterAi${field[0].toUpperCase()}${field.slice(1)}`]))
const LONG_FIELDS = new Set(['appearance', 'personality', 'background'])
const REASONING_KEY = 'qibi:ai-reasoning'
const REASONING_LABELS = { none: 'aiReasoningNone', off: 'aiReasoningNone', minimal: 'aiReasoningMinimal', low: 'aiReasoningLow', medium: 'aiReasoningMedium', high: 'aiReasoningHigh', xhigh: 'aiReasoningXhigh', max: 'aiReasoningMax' }
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

function Field({ label, children }) {
  return <label className="qibi-field"><span className="qibi-label">{label}</span>{children}</label>
}

function preferences() {
  try {
    const value = JSON.parse(localStorage.getItem(REASONING_KEY) || '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch { return {} }
}

function validEffort(info, value) {
  return info?.reasoning?.supported && typeof value === 'string' && info.reasoning.efforts?.some(row => row.id === value) ? value : ''
}

function reasoningLabel(row, t) {
  return REASONING_LABELS[row.id] ? t(REASONING_LABELS[row.id]) : row.name || row.id
}

function errorText(error) {
  return error instanceof Error ? error.message : String(error)
}

/** Preview first; only the explicit import action writes character records. */
export default function CharacterAiDialog({ call, novelId, chapterId, characters = [], writable, initialAction = 'extract', t, onClose, onImported }) {
  const action = initialAction === 'generate' ? 'generate' : 'extract'
  const [scope, setScope] = useState(chapterId != null ? 'chapter' : 'all')
  const [chapterList, setChapterList] = useState(null)
  const [chapterError, setChapterError] = useState('')
  const [chapterRetry, setChapterRetry] = useState(0)
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [pendingReset, setPendingReset] = useState(null)
  const [importedNames, setImportedNames] = useState([])
  const [importedOrigins, setImportedOrigins] = useState([])
  const [idea, setIdea] = useState('')
  const [info, setInfo] = useState(null)
  const [modelLoading, setModelLoading] = useState(true)
  const [modelError, setModelError] = useState('')
  const [infoRetry, setInfoRetry] = useState(0)
  const [effort, setEffort] = useState('')
  const [busy, setBusy] = useState('')
  const [candidates, setCandidates] = useState([])
  const [source, setSource] = useState(null)
  const [hasResult, setHasResult] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [importFeedback, setImportFeedback] = useState(null)
  const dialogRef = useRef(null)
  const taskRef = useRef(null)
  const busyRef = useRef('')
  const chaptersRef = useRef(null)
  const chapterContextRef = useRef(null)
  const infoRef = useRef(null)
  const closedRef = useRef(false)
  const contextRef = useRef(null)
  const latestRef = useRef(null)
  const modelContextRef = useRef(null)
  const resultContextRef = useRef(null)
  const titleId = useId()
  const statusId = useId()
  contextRef.current = { call, novelId, chapterId, action }
  latestRef.current = { characters, writable, onClose, onImported, t }

  const updateBusy = value => {
    busyRef.current = value
    setBusy(value)
  }

  const matchesContext = context => {
    const current = contextRef.current
    return Boolean(context) && !closedRef.current && current.call === context.call && current.novelId === context.novelId && current.chapterId === context.chapterId && current.action === context.action
  }

  const abortRequests = () => {
    infoRef.current?.abort()
    infoRef.current = null
    chaptersRef.current?.abort()
    chaptersRef.current = null
    // An acknowledged import may already have committed; detach stale UI only.
    if (taskRef.current?.kind !== 'import') taskRef.current?.controller.abort()
    taskRef.current = null
  }

  const close = () => {
    if (closedRef.current || taskRef.current?.kind === 'import' || busyRef.current === 'import') return
    closedRef.current = true
    abortRequests()
    latestRef.current.onClose?.()
  }
  const closeRef = useRef(close)
  closeRef.current = close

  useEffect(() => {
    const trigger = document.activeElement
    dialogRef.current?.focus()
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeRef.current()
      } else if (event.key === 'Tab' && dialogRef.current) {
        const dialog = dialogRef.current
        const controls = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(node => node.getClientRects().length > 0 && !node.matches(':disabled') && node.getAttribute('aria-hidden') !== 'true')
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (!first) {
          event.preventDefault()
          dialog.focus()
        } else if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement))) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    // Capture Escape so a surrounding panel dialog cannot close twice.
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      if (trigger?.isConnected && typeof trigger.focus === 'function') trigger.focus()
    }
  }, [])

  useEffect(() => {
    closedRef.current = false
    modelContextRef.current = null
    resultContextRef.current = null
    chapterContextRef.current = null
    setScope(chapterId != null ? 'chapter' : 'all')
    setChapterList(null)
    setChapterError('')
    setRangeStart('')
    setRangeEnd('')
    setPendingReset(null)
    setImportedNames([])
    setImportedOrigins([])
    setIdea('')
    setCandidates([])
    setSource(null)
    setHasResult(false)
    setError('')
    setStatus('')
    setImportFeedback(null)
    updateBusy('')
    return () => {
      closedRef.current = true
      abortRequests()
    }
  }, [call, novelId, chapterId, action])

  useEffect(() => {
    const controller = new AbortController()
    const context = contextRef.current
    infoRef.current = controller
    setInfo(null)
    setModelLoading(true)
    setModelError('')
    const current = () => matchesContext(context) && infoRef.current === controller && !controller.signal.aborted
    // Promise.resolve also handles a call adapter that throws synchronously.
    Promise.resolve().then(() => current() ? call('aiInfo', {}, { signal: controller.signal }) : undefined).then(result => {
      if (!current()) return
      modelContextRef.current = context
      setInfo(result)
      setEffort(validEffort(result, preferences()[result?.model]))
    }).catch(cause => {
      if (current()) setModelError(errorText(cause))
    }).finally(() => {
      if (current()) {
        setModelLoading(false)
        infoRef.current = null
      }
    })
    return () => {
      controller.abort()
      if (infoRef.current === controller) infoRef.current = null
    }
  }, [call, novelId, chapterId, action, infoRetry])

  useEffect(() => {
    if (action !== 'extract' || novelId == null) return
    const controller = new AbortController()
    const context = contextRef.current
    chaptersRef.current = controller
    setChapterError('')
    const current = () => matchesContext(context) && chaptersRef.current === controller && !controller.signal.aborted
    Promise.resolve().then(() => current() ? call('chapters', { novelId }, { signal: controller.signal }) : undefined).then(result => {
      if (!current()) return
      if (!Array.isArray(result?.chapters)) throw Error(latestRef.current.t('characterAiBatchInvalid'))
      chapterContextRef.current = context
      setChapterList(result.chapters)
      setRangeStart(String(result.chapters[0]?.id ?? ''))
      setRangeEnd(String(result.chapters.at(-1)?.id ?? ''))
    }).catch(cause => {
      if (current()) setChapterError(errorText(cause))
    })
    return () => {
      controller.abort()
      if (chaptersRef.current === controller) chaptersRef.current = null
    }
  }, [call, novelId, chapterId, action, chapterRetry])

  const beginTask = kind => {
    if (closedRef.current || taskRef.current || busyRef.current) return null
    const task = { controller: new AbortController(), context: contextRef.current, kind }
    taskRef.current = task
    updateBusy(kind)
    setError('')
    setStatus('')
    setImportFeedback(null)
    return task
  }
  const currentTask = task => taskRef.current === task && matchesContext(task.context) && !task.controller.signal.aborted
  const finishTask = task => {
    if (!currentTask(task)) return
    taskRef.current = null
    updateBusy('')
  }
  const cancel = () => {
    if (taskRef.current?.kind === 'import' || busyRef.current === 'import') return
    taskRef.current?.controller.abort()
    taskRef.current = null
    updateBusy('')
    setStatus(t('characterAiCancelled'))
  }

  const chooseEffort = event => {
    const next = validEffort(info, event.target.value)
    setEffort(next)
    if (info?.model) {
      try { localStorage.setItem(REASONING_KEY, JSON.stringify({ ...preferences(), [info.model]: next })) } catch { /* Storage may be unavailable. */ }
    }
  }

  const loadedChapters = matchesContext(chapterContextRef.current) ? chapterList : null
  const batching = action === 'extract' && scope !== 'chapter'
  const startIndex = scope === 'all' ? 0 : loadedChapters?.findIndex(row => String(row.id) === rangeStart) ?? -1
  const endIndex = scope === 'all' ? (loadedChapters?.length ?? 0) - 1 : loadedChapters?.findIndex(row => String(row.id) === rangeEnd) ?? -1
  const validRange = Boolean(loadedChapters?.length && startIndex >= 0 && endIndex >= startIndex)
  const rangeSize = validRange ? endIndex - startIndex + 1 : 0
  const batchCursor = batching ? source?.nextCursor : null
  const batchDone = batching && source?.done === true
  const candidateNames = rows => rows.map(row => characterNameKey(row.name)).filter(Boolean)
  const existingNames = new Set([...candidateNames(characters || []), ...importedNames])

  const resetPreview = change => {
    setPendingReset(null)
    setSource(null)
    setHasResult(false)
    setCandidates([])
    setError('')
    setStatus('')
    setImportFeedback(null)
    switch (change.kind) {
      case 'scope': setScope(change.value); break
      case 'start': setRangeStart(change.value); break
      case 'end': setRangeEnd(change.value); break
      case 'restart': setChapterRetry(value => value + 1); break
    }
  }
  const requestReset = change => {
    if (closedRef.current || busyRef.current || pendingReset) return
    if (candidates.length > 0) setPendingReset(change)
    else resetPreview(change)
  }
  const canStart = Boolean(matchesContext(modelContextRef.current) && !busy && !pendingReset && !modelLoading && info?.available && info?.model && novelId != null &&
    (action === 'generate' ? idea.trim() : batching ? validRange && !batchDone : chapterId != null))

  const start = async () => {
    if (!canStart) return
    const task = beginTask('preview')
    if (!task) return
    try {
      const reasoningEffort = validEffort(info, effort)
      const result = await call('characterAi', {
        novelId, action, modelKey: info.model,
        ...(batching ? { scope: 'range', startChapterId: loadedChapters[startIndex].id, endChapterId: loadedChapters[endIndex].id, ...(batchCursor ? { batchCursor } : {}) }
          : action === 'extract' ? { scope: 'chapter', chapterId } : { idea: idea.trim() }),
        ...(info.reasoning?.supported ? { reasoningEffort } : {}),
      }, { signal: task.controller.signal })
      if (!currentTask(task)) return
      if (batching && (!Array.isArray(result?.characters) || result.characters.length > CHARACTER_IMPORT_LIMIT || !validRangeSource(result?.source, batchCursor, rangeSize))) {
        throw Error(t('characterAiBatchInvalid'))
      }
      const incoming = Array.isArray(result?.characters) ? result.characters : []
      const names = new Set([...candidateNames(latestRef.current.characters || []), ...importedNames])
      const next = mergeCharacterCandidates(batching ? candidates : [], incoming, names, new Set(importedOrigins))
      resultContextRef.current = task.context
      setCandidates(next)
      setSource(result?.source ?? null)
      setHasResult(true)
      setStatus(batching && incoming.length ? t('characterAiBatchMerged') : next.length ? t('characterAiPreviewReady') : t('characterAiEmpty'))
    } catch (cause) {
      if (currentTask(task)) setError(errorText(cause))
    } finally { finishTask(task) }
  }

  const selected = candidates.filter(row => row.selected)
  const invalidNames = selected.some(row => !row.fields.name.trim())
  const updateCandidate = (origin, change) => {
    if (closedRef.current || busyRef.current || pendingReset) return
    setCandidates(rows => rows.map(row => row.origin === origin ? { ...row, ...change(row) } : row))
  }
  const selectCandidate = (origin, checked) => {
    if (closedRef.current || busyRef.current || pendingReset) return
    setCandidates(rows => {
      if (checked && rows.filter(row => row.selected).length >= CHARACTER_IMPORT_LIMIT) return rows
      return rows.map(row => row.origin === origin ? { ...row, selected: checked } : row)
    })
  }
  const editCandidate = (origin, field, value) => updateCandidate(origin, row => ({ fields: { ...row.fields, [field]: value }, edited: { ...row.edited, [field]: true } }))

  const importSelected = async () => {
    if (!matchesContext(resultContextRef.current) || pendingReset || !latestRef.current.writable || novelId == null || !selected.length || selected.length > CHARACTER_IMPORT_LIMIT || invalidNames) return
    const task = beginTask('import')
    if (!task) return
    try {
      const result = await call('importCharacters', {
        novelId,
        characters: selected.map(row => ({ ...candidateFields(row.fields), name: row.fields.name.trim() })),
      }, { signal: task.controller.signal })
      if (!currentTask(task)) return
      const removed = new Set(selected.map(row => row.origin))
      setCandidates(rows => rows.filter(row => !removed.has(row.origin)))
      setImportedNames(names => [...new Set([...names, ...candidateNames(Array.isArray(result?.characters) ? result.characters : selected.map(row => row.fields))])])
      setImportedOrigins(origins => [...new Set([...origins, ...removed])])
      setImportFeedback({ created: result?.created ?? 0, skipped: result?.skipped ?? 0 })
      setStatus(t('characterAiImported'))
      await latestRef.current.onImported?.(result)
      if (currentTask(task)) {
        finishTask(task)
        if (selected.length === candidates.length && (!batching || batchDone)) closeRef.current()
      }
    } catch (cause) {
      if (currentTask(task)) setError(errorText(cause))
    } finally { finishTask(task) }
  }

  const reasoning = info?.reasoning
  const inheritedEffort = reasoning?.selectedEffort ?? reasoning?.defaultEffort
  const inheritedRow = reasoning?.efforts?.find(row => row.id === inheritedEffort)
  const title = t(action === 'extract' ? 'characterAiExtractTitle' : 'characterAiGenerateTitle')
  const scopeLabel = value => t(value === 'chapter' ? 'characterAiCurrentChapter' : value === 'range' ? 'characterAiChapterRange' : 'characterAiAllChapters')
  const rangeLoading = batching && !loadedChapters && !chapterError
  const rangeProgress = batchDone ? rangeSize : batchCursor?.chapterIndex ?? 0
  const controlsDisabled = Boolean(busy) || Boolean(pendingReset)
  const selectRange = (label, value, kind) => <Field label={t(label)}>
    <select className="qibi-select" aria-label={t(label)} value={value} disabled={controlsDisabled} onChange={event => requestReset({ kind, value: event.target.value })}>
      {loadedChapters.map((row, index) => <option key={row.id} value={String(row.id)}>{index + 1}. {row.title}</option>)}
    </select>
  </Field>

  return (
    <div className="qibi-overlay qibi-character-ai-overlay" onMouseDown={event => { if (event.target === event.currentTarget) close() }}>
      <div ref={dialogRef} className="qibi-dialog qibi-character-ai-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={statusId} aria-busy={Boolean(busy) || modelLoading} tabIndex={-1}>
        <div className="qibi-dialog-head">
          <strong id={titleId}>{title}</strong>
          <span className="qibi-spacer" />
          <button type="button" className="qibi-btn small" aria-label={t('close')} title={t('close')} disabled={busy === 'import'} onClick={close}>×</button>
        </div>
        <div className="qibi-dialog-body qibi-character-ai-body">
          <div className="qibi-character-ai-settings">
            <div className="qibi-row qibi-character-ai-model-settings" aria-busy={modelLoading}>
              <Field label={t('aiGenerationModel')}>
                <span className="qibi-sub" title={info?.model ?? ''}>{modelLoading ? t('aiModelLoading') : info?.model || t('aiUnavailable')}</span>
              </Field>
              {reasoning?.supported && <Field label={t('aiReasoning')}>
                <select className="qibi-select" aria-label={t('aiReasoning')} value={validEffort(info, effort)} onChange={chooseEffort} disabled={Boolean(busy) || modelLoading}>
                  <option value="">{t('aiReasoningFollow')}{inheritedRow ? ` · ${reasoningLabel(inheritedRow, t)}` : ''}</option>
                  {(reasoning.efforts || []).map(row => <option key={row.id} value={row.id} title={row.description}>{reasoningLabel(row, t)}</option>)}
                </select>
              </Field>}
            </div>
            {!modelLoading && !modelError && <p className="qibi-sub">{!info?.available ? t('aiUnavailable') : reasoning?.supported ? t('aiReasoningHint') : reasoning?.known ? t('aiReasoningUnsupported') : t('aiReasoningUnknown')}</p>}
            {modelError && <div role="alert" className="qibi-character-ai-error"><p>{modelError}</p><button type="button" className="qibi-btn small" disabled={Boolean(busy)} onClick={() => setInfoRetry(value => value + 1)}>{t('retry')}</button></div>}
            {action === 'extract' ? <>
              <Field label={t('characterAiScope')}>
                <select className="qibi-select" aria-label={t('characterAiScope')} value={scope} onChange={event => requestReset({ kind: 'scope', value: event.target.value })} disabled={controlsDisabled}>
                  <option value="chapter" disabled={chapterId == null}>{t('characterAiCurrentChapter')}</option>
                  <option value="range">{t('characterAiChapterRange')}</option>
                  <option value="all">{t('characterAiAllChapters')}</option>
                </select>
              </Field>
              {scope === 'range' && loadedChapters?.length > 0 && <div className="qibi-character-batch-range">
                {selectRange('characterAiRangeStart', rangeStart, 'start')}
                {selectRange('characterAiRangeEnd', rangeEnd, 'end')}
              </div>}
              {rangeLoading && <p className="qibi-sub" role="status">{t('characterAiChaptersLoading')}</p>}
              {batching && chapterError && <div className="qibi-character-ai-error" role="alert"><p>{chapterError}</p><button type="button" className="qibi-btn small" disabled={controlsDisabled} onClick={() => setChapterRetry(value => value + 1)}>{t('retry')}</button></div>}
              {batching && loadedChapters?.length === 0 && <p className="qibi-sub">{t('characterAiChaptersEmpty')}</p>}
              {batching && loadedChapters?.length > 0 && !validRange && <p className="qibi-character-ai-error" role="alert">{t('characterAiRangeInvalid')}</p>}
              <p className="qibi-sub">{t(batching ? 'characterAiBatchHint' : 'characterAiChapterHint')}</p>
              {pendingReset && <div className="qibi-character-batch-reset">
                <p className="qibi-sub" role="status">{t('characterAiResetConfirm')}</p>
                <div className="qibi-row">
                  <button type="button" className="qibi-btn small" onClick={() => resetPreview(pendingReset)}>{t('characterAiResetApply')}</button>
                  <button type="button" className="qibi-btn small" onClick={() => setPendingReset(null)}>{t('characterAiResetKeep')}</button>
                </div>
              </div>}
            </> : <Field label={t('characterAiIdea')}>
              <textarea className="qibi-textarea" rows={3} value={idea} onChange={event => setIdea(event.target.value)} placeholder={t('characterAiIdeaPlaceholder')} disabled={Boolean(busy)} />
            </Field>}
            <p className="qibi-sub">{t('characterAiPreviewHint')}</p>
            {!writable && <p className="qibi-sub">{t('characterAiReadOnly')}</p>}
          </div>

          <div id={statusId} className="qibi-character-ai-status" role="status" aria-live="polite" aria-atomic="true">
            {busy ? t(busy === 'import' ? 'characterAiImporting' : 'characterAiWorking') : status || (modelLoading ? t('aiModelLoading') : '')}
            {importFeedback && <span> · {t('characterAiCreated')} {importFeedback.created} · {t('characterAiSkipped')} {importFeedback.skipped}</span>}
          </div>
          {error && <div className="qibi-character-ai-error" role="alert">{error}</div>}
          {source && action === 'extract' && <div className="qibi-sub qibi-character-ai-source" role="status">
            {scopeLabel(scope)} · {source.scope === 'range'
              ? <>{t('characterAiBatchAnalyzed')} {source.analyzedChapters} · {t('characterAiBatchProgress')} {rangeProgress} / {rangeSize}</>
              : <>{t('characterAiAnalyzedChapters')} {source.analyzedChapters ?? 0} / {source.availableChapters ?? 0}</>}
            {source.scope === 'range' ? <p>{t(batchDone ? 'characterAiBatchDone' : 'characterAiBatchPending')}</p> : source.truncated && <p>{t('characterAiTruncated')}</p>}
          </div>}
          {hasResult && candidates.length === 0 && !importFeedback && <p className="qibi-empty">{t('characterAiEmpty')}</p>}
          {candidates.length > 0 && <section className="qibi-character-ai-candidates" aria-label={t('characterAiCandidates')}>
            <p className="qibi-sub">{t('characterAiReviewHint')}</p>
            {(candidates.length > CHARACTER_IMPORT_LIMIT || selected.length >= CHARACTER_IMPORT_LIMIT) && <p className="qibi-sub">{t('characterAiSelectionLimit')}</p>}
            {candidates.map((row, index) => {
              const key = characterNameKey(row.fields.name)
              const sameName = key && (existingNames.has(key) || candidates.slice(0, index).some(other => characterNameKey(other.fields.name) === key))
              return <fieldset key={row.origin} className="qibi-character-ai-candidate" disabled={controlsDisabled}>
                <legend><label className="qibi-character-ai-selection"><input type="checkbox" disabled={controlsDisabled || (!row.selected && selected.length >= CHARACTER_IMPORT_LIMIT)} checked={row.selected} onChange={event => selectCandidate(row.origin, event.target.checked)} /> {t('characterAiSelectCandidate')} {index + 1}</label></legend>
                {sameName && <p className="qibi-sub">{t('characterAiDuplicate')}</p>}
                <div className="qibi-character-ai-fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
                  {FIELDS.map(field => <Field key={field} label={`${t(FIELD_KEYS[field])}${field === 'name' ? ' *' : ''}`}>
                    {LONG_FIELDS.has(field) ? <textarea className="qibi-textarea" rows={3} value={row.fields[field]} onChange={event => editCandidate(row.origin, field, event.target.value)} /> : <input className="qibi-input" value={row.fields[field]} required={field === 'name' && row.selected} aria-invalid={field === 'name' && row.selected && !row.fields.name.trim() ? true : undefined} onChange={event => editCandidate(row.origin, field, event.target.value)} />}
                  </Field>)}
                </div>
              </fieldset>
            })}
          </section>}
        </div>
        <div className="qibi-dialog-foot qibi-character-ai-footer">
          <span className="qibi-sub qibi-character-ai-selection-count">{t('characterAiSelected')} {selected.length}{invalidNames ? ` · ${t('characterAiNameRequired')}` : ''}</span>
          <span className="qibi-spacer" />
          {!busy && batching && hasResult && <button type="button" className="qibi-btn" disabled={controlsDisabled} onClick={() => requestReset({ kind: 'restart' })}>{t('characterAiResetPreview')}</button>}
          {busy === 'import' ? <button type="button" className="qibi-btn" disabled>{t('characterAiImporting')}</button> : busy ? <button type="button" className="qibi-btn" onClick={cancel}>{t('characterAiCancelRequest')}</button> : !batchDone && <button type="button" className="qibi-btn" onClick={start} disabled={!canStart}>{t(batchCursor ? 'characterAiNextBatch' : hasResult ? 'characterAiRetryPreview' : action === 'extract' ? 'characterAiStartExtract' : 'characterAiStartGenerate')}</button>}
          <button type="button" className="qibi-btn primary" disabled={!matchesContext(resultContextRef.current) || controlsDisabled || !writable || !selected.length || selected.length > CHARACTER_IMPORT_LIMIT || invalidNames || novelId == null} onClick={importSelected}>{t('characterAiConfirmImport')}</button>
        </div>
      </div>
    </div>
  )
}
