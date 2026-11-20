import React, { useId, useRef } from 'react'

const PHASE_KEYS = {
  running: 'continuityOrganizerRunning',
  done: 'continuityOrganizerDone',
  error: 'continuityOrganizerError',
  cancelled: 'continuityOrganizerCancelled',
}

export default function ContinuityOrganizer({ chapter, canOrganize, unavailableKey, writable, enabled, onToggle, onOrganize, onCancel, task, hasSummary, t }) {
  const id = useId()
  const latest = useRef(null)
  latest.current = { chapter, canOrganize, writable, enabled, onToggle, onOrganize, onCancel, task }
  const running = task?.phase === 'running'
  const disabled = !chapter || !canOrganize || !writable || running
  const statusKey = !chapter ? 'continuityOrganizerSelectChapter'
    : !writable ? 'continuityOrganizerReadOnly'
      : running ? 'continuityOrganizerBusy'
        : !canOrganize ? unavailableKey ?? 'continuityOrganizerNoBody'
          : hasSummary ? 'continuityOrganizerHasSummary' : 'continuityOrganizerReady'

  const organize = () => {
    const current = latest.current
    if (!current.chapter || !current.canOrganize || !current.writable || current.task?.phase === 'running') return
    current.onOrganize?.()
  }
  const toggle = event => {
    const current = latest.current
    const next = event.target.checked
    // Disabling automation remains available after writing has been turned off.
    if ((next && !current.writable) || next === Boolean(current.enabled)) return
    current.onToggle?.(next)
  }
  const cancel = () => {
    const current = latest.current
    if (current.task?.phase !== 'running') return
    current.onCancel?.()
  }

  return <section className="qibi-continuity-organizer" aria-labelledby={`${id}-title`}>
    <header className="qibi-continuity-organizer-header">
      <h3 id={`${id}-title`} className="qibi-section-title qibi-continuity-organizer-title">{t('continuityOrganizerTitle')}</h3>
      {chapter && <p className="qibi-continuity-organizer-chapter">
        <span className="qibi-sub">{t('continuityOrganizerCurrentChapter')}</span>
        <strong className="qibi-continuity-organizer-chapter-title">{chapter.title || t('untitled')}</strong>
      </p>}
    </header>
    <div className="qibi-actions qibi-continuity-organizer-actions">
      <button type="button" className="qibi-btn primary" disabled={disabled} aria-describedby={`${id}-status`} onClick={organize}>{t('continuityOrganizerAction')}</button>
      <p id={`${id}-status`} className="qibi-sub qibi-continuity-organizer-status">{t(statusKey)}</p>
    </div>
    <label className="qibi-continuity-organizer-auto" title={t('continuityOrganizerAutoTitle')}>
      <input type="checkbox" checked={Boolean(enabled)} disabled={!writable && !enabled} title={t('continuityOrganizerAutoTitle')} onChange={toggle} />
      <span>{t('continuityOrganizerAuto')}</span>
    </label>
    <div className="qibi-continuity-organizer-feedback" role={task?.phase === 'error' ? 'alert' : 'status'} aria-live={task?.phase === 'error' ? 'assertive' : 'polite'} aria-atomic="true">
      {task && <div className="qibi-continuity-organizer-task" data-phase={task.phase}>
        <div className="qibi-row qibi-continuity-organizer-task-heading">
          <strong>{t(PHASE_KEYS[task.phase])}</strong>
          {running && <button type="button" className="qibi-btn small" onClick={cancel}>{t('continuityOrganizerCancel')}</button>}
        </div>
        <p className="qibi-continuity-organizer-chapter">
          <span className="qibi-sub">{t('continuityOrganizerTaskChapter')}</span>
          <strong className="qibi-continuity-organizer-chapter-title">{task.title || t('untitled')}</strong>
        </p>
        {task.message && <p className={task.phase === 'error' ? 'qibi-error-text qibi-continuity-organizer-message' : 'qibi-sub qibi-continuity-organizer-message'}>{task.message}</p>}
        {task.phase === 'done' && task.result && <>
          {task.result.alreadyOrganized && <p className="qibi-sub qibi-continuity-organizer-message">{t('continuityOrganizerAlreadyOrganized')}</p>}
          <ul className="qibi-continuity-organizer-stats">
            <li>{t('continuityOrganizerFilled').replace('{n}', String(task.result.filled ?? 0))}</li>
            <li>{t('continuityOrganizerForeshadowAdded').replace('{n}', String(task.result.foreshadowAdded ?? 0))}</li>
          </ul>
          {task.result.ledgerSkipped && <p className="qibi-sub qibi-continuity-organizer-message">{t('continuityOrganizerLedgerSkipped')}</p>}
        </>}
      </div>}
    </div>
    <hr className="qibi-continuity-organizer-divider" />
  </section>
}
