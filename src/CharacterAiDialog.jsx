import React, { useEffect, useId, useRef, useState } from 'react'

const FIELDS = ['name', 'alias', 'role', 'gender', 'age', 'appearance', 'personality', 'background']
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

function candidateFields(candidate) {
  return Object.fromEntries(FIELDS.map(field => [field, typeof candidate?.[field] === 'string' ? candidate[field] : '']))
}

function errorText(error) {
  return error instanceof Error ? error.message : String(error)
}

/** Preview first; only the explicit import action writes character records. */
export default function CharacterAiDialog({ call, novelId, chapterId, characters = [], writable, initialAction = 'extract', t, onClose, onImported }) {
  const action = initialAction === 'generate' ? 'generate' : 'extract'
  const [scope, setScope] = useState(chapterId != null ? 'chapter' : 'all')
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
    setScope(chapterId != null ? 'chapter' : 'all')
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

  const start = async () => {
    if (!matchesContext(modelContextRef.current) || modelLoading || !info?.available || !info.model || novelId == null || (action === 'generate' && !idea.trim()) || (action === 'extract' && scope === 'chapter' && chapterId == null)) return
    const task = beginTask('preview')
    if (!task) return
    try {
      const reasoningEffort = validEffort(info, effort)
      const result = await call('characterAi', {
        novelId, action, scope, modelKey: info.model,
        ...(action === 'extract' && scope === 'chapter' ? { chapterId } : {}),
        ...(action === 'generate' ? { idea: idea.trim() } : {}),
        ...(info.reasoning?.supported ? { reasoningEffort } : {}),
      }, { signal: task.controller.signal })
      if (!currentTask(task)) return
      const names = new Set((latestRef.current.characters || []).map(row => String(row.name ?? '').trim()))
      const next = (Array.isArray(result?.characters) ? result.characters : []).map(row => {
        const fields = candidateFields(row)
        const name = fields.name.trim()
        const selected = Boolean(name) && !names.has(name)
        names.add(name)
        return { fields, selected }
      })
      resultContextRef.current = task.context
      setCandidates(next)
      setSource(result?.source ?? null)
      setHasResult(true)
      setStatus(next.length ? t('characterAiPreviewReady') : t('characterAiEmpty'))
    } catch (cause) {
      if (currentTask(task)) setError(errorText(cause))
    } finally { finishTask(task) }
  }

  const existingNames = new Set((characters || []).map(row => String(row.name ?? '').trim()))
  const selected = candidates.filter(row => row.selected)
  const invalidNames = selected.some(row => !row.fields.name.trim())
  const updateCandidate = (index, change) => setCandidates(rows => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...change(row) } : row))

  const importSelected = async () => {
    if (!matchesContext(resultContextRef.current) || !latestRef.current.writable || novelId == null || !selected.length || invalidNames) return
    const task = beginTask('import')
    if (!task) return
    try {
      const result = await call('importCharacters', {
        novelId,
        characters: selected.map(row => ({ ...candidateFields(row.fields), name: row.fields.name.trim() })),
      }, { signal: task.controller.signal })
      if (!currentTask(task)) return
      setImportFeedback({ created: result?.created ?? 0, skipped: result?.skipped ?? 0 })
      setStatus(t('characterAiImported'))
      await latestRef.current.onImported?.(result)
      if (currentTask(task)) {
        finishTask(task)
        closeRef.current()
      }
    } catch (cause) {
      if (currentTask(task)) setError(errorText(cause))
    } finally { finishTask(task) }
  }

  const reasoning = info?.reasoning
  const inheritedEffort = reasoning?.selectedEffort ?? reasoning?.defaultEffort
  const inheritedRow = reasoning?.efforts?.find(row => row.id === inheritedEffort)
  const title = t(action === 'extract' ? 'characterAiExtractTitle' : 'characterAiGenerateTitle')
  const canStart = matchesContext(modelContextRef.current) && !busy && !modelLoading && info?.available && info?.model && novelId != null && (action !== 'generate' || idea.trim()) && (action !== 'extract' || scope !== 'chapter' || chapterId != null)

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
                <select className="qibi-select" value={scope} onChange={event => setScope(event.target.value)} disabled={Boolean(busy)}>
                  <option value="chapter" disabled={chapterId == null}>{t('characterAiCurrentChapter')}</option>
                  <option value="all">{t('characterAiAllChapters')}</option>
                </select>
              </Field>
              <p className="qibi-sub">{t(scope === 'chapter' ? 'characterAiChapterHint' : 'characterAiAllHint')}</p>
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
          {source && action === 'extract' && <div className="qibi-sub qibi-character-ai-source">
            {t(source.scope === 'all' ? 'characterAiAllChapters' : 'characterAiCurrentChapter')} · {t('characterAiAnalyzedChapters')} {source.analyzedChapters ?? 0} / {source.availableChapters ?? 0}
            {source.truncated && <p>{t('characterAiTruncated')}</p>}
          </div>}
          {hasResult && candidates.length === 0 && <p className="qibi-empty">{t('characterAiEmpty')}</p>}
          {candidates.length > 0 && <section className="qibi-character-ai-candidates" aria-label={t('characterAiCandidates')}>
            <p className="qibi-sub">{t('characterAiReviewHint')}</p>
            {candidates.map((row, index) => {
              const sameName = existingNames.has(row.fields.name.trim()) || candidates.slice(0, index).some(other => other.fields.name.trim() && other.fields.name.trim() === row.fields.name.trim())
              return <fieldset key={index} className="qibi-character-ai-candidate" disabled={Boolean(busy)}>
                <legend><label className="qibi-character-ai-selection"><input type="checkbox" disabled={Boolean(busy)} checked={row.selected} onChange={event => { const checked = event.target.checked; updateCandidate(index, () => ({ selected: checked })) }} /> {t('characterAiSelectCandidate')} {index + 1}</label></legend>
                {sameName && <p className="qibi-sub">{t('characterAiDuplicate')}</p>}
                <div className="qibi-character-ai-fields" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
                  {FIELDS.map(field => <Field key={field} label={`${t(FIELD_KEYS[field])}${field === 'name' ? ' *' : ''}`}>
                    {LONG_FIELDS.has(field) ? <textarea className="qibi-textarea" rows={3} value={row.fields[field]} onChange={event => { const value = event.target.value; updateCandidate(index, previous => ({ fields: { ...previous.fields, [field]: value } })) }} /> : <input className="qibi-input" value={row.fields[field]} required={field === 'name' && row.selected} aria-invalid={field === 'name' && row.selected && !row.fields.name.trim() ? true : undefined} onChange={event => { const value = event.target.value; updateCandidate(index, previous => ({ fields: { ...previous.fields, [field]: value } })) }} />}
                  </Field>)}
                </div>
              </fieldset>
            })}
          </section>}
        </div>
        <div className="qibi-dialog-foot qibi-character-ai-footer">
          <span className="qibi-sub qibi-character-ai-selection-count">{t('characterAiSelected')} {selected.length}{invalidNames ? ` · ${t('characterAiNameRequired')}` : ''}</span>
          <span className="qibi-spacer" />
          {busy === 'import' ? <button type="button" className="qibi-btn" disabled>{t('characterAiImporting')}</button> : busy ? <button type="button" className="qibi-btn" onClick={cancel}>{t('characterAiCancelRequest')}</button> : <button type="button" className="qibi-btn" onClick={start} disabled={!canStart}>{t(hasResult ? 'characterAiRetryPreview' : action === 'extract' ? 'characterAiStartExtract' : 'characterAiStartGenerate')}</button>}
          <button type="button" className="qibi-btn primary" disabled={!matchesContext(resultContextRef.current) || Boolean(busy) || !writable || !selected.length || invalidNames || novelId == null} onClick={importSelected}>{t('characterAiConfirmImport')}</button>
        </div>
      </div>
    </div>
  )
}
