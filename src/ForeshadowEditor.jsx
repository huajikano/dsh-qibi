import React, { useId, useRef, useState } from 'react'
import { addForeshadowing, parseForeshadowing, removeForeshadowing, updateForeshadowing } from '../lib/foreshadowing.js'

let keySequence = 0
const rowKey = () => `foreshadow-row-${++keySequence}`
const identity = entry => entry.kind === 'object' && (typeof entry.id === 'string' || typeof entry.id === 'number') ? `${typeof entry.id}:${entry.id}` : null

/** Keep keys with surviving entries, including legacy strings/objects without IDs.
 * Pending local operations explicitly carry their keys across controlled updates.
 * External replacements first match IDs, then untouched entry content.
 */
function reconcileKeys(previous, parsed) {
  const used = new Set()
  return parsed.entries.map((entry, index) => {
    let found = -1
    const id = identity(entry)
    if (id !== null) found = previous.entries.findIndex((old, position) => !used.has(position) && identity(old) === id)
    if (found < 0) {
      const serialized = JSON.stringify(parsed.data[index])
      found = previous.data.findIndex((old, position) => !used.has(position) && JSON.stringify(old) === serialized)
    }
    if (found < 0 && previous.keys.length === parsed.entries.length && !used.has(index)) found = index
    if (found < 0) return rowKey()
    used.add(found)
    return previous.keys[found]
  })
}

/** Controlled JSON-string editor. onChange may receive invalid JSON from the
 * advanced textarea; callers should validate at their normal Save boundary.
 */
export default function ForeshadowEditor({ value = '[]', onChange, disabled = false, t }) {
  const parsed = parseForeshadowing(value)
  const [advanced, setAdvanced] = useState({ open: false })
  const autoOpened = useRef(false)
  if (!parsed.editable) autoOpened.current = true
  const hintId = useId()
  const keyState = useRef({ raw: null, entries: [], data: [], keys: [], pending: null })
  const previous = keyState.current
  if (previous.raw !== parsed.raw) {
    const keys = previous.pending?.raw === parsed.raw
      ? previous.pending.keys
      : parsed.editable ? reconcileKeys(previous, parsed) : []
    keyState.current = { raw: parsed.raw, entries: parsed.entries, data: parsed.data ?? [], keys, pending: null }
  }
  const keys = keyState.current.keys
  const emit = (next, nextKeys) => {
    if (disabled || next === parsed.raw) return
    keyState.current.pending = nextKeys ? { raw: next, keys: nextKeys } : null
    onChange?.(next)
  }
  const update = (index, patch) => {
    if (disabled) return
    emit(updateForeshadowing(parsed.raw, index, patch, { disabled }), keys)
  }
  const add = () => {
    if (disabled) return
    emit(addForeshadowing(parsed.raw, { disabled }), [...keys, rowKey()])
  }
  const remove = index => {
    if (disabled || !parsed.editable) return
    if (!window.confirm(t('foreshadowDeleteConfirm'))) return
    // Check the gate again after the modal, before issuing a controlled write.
    if (disabled) return
    emit(removeForeshadowing(parsed.raw, index, { disabled }), keys.filter((_, position) => position !== index))
  }
  const showRaw = advanced.open || autoOpened.current
  const toggleAdvanced = () => {
    if (!parsed.editable) return
    autoOpened.current = false
    // A new state object also renders an explicit collapse of an auto-opened
    // view, even when the author's previous manual preference was closed.
    setAdvanced({ open: !showRaw })
  }

  return (
    <div className="qibi-foreshadow-editor">
      {parsed.editable && (
        <fieldset className="qibi-foreshadow-list" disabled={disabled}>
          <legend className="qibi-label">{t('foreshadowList')}</legend>
          {parsed.entries.length === 0 && <p className="qibi-sub">{t(disabled ? 'foreshadowEmptyReadOnly' : 'foreshadowEmpty')}</p>}
          {parsed.entries.map((entry, index) => (
            <fieldset className="qibi-foreshadow-entry" key={keys[index]} disabled={disabled}>
              <legend className="qibi-label">{t('foreshadowEntry')} {index + 1}</legend>
              {entry.kind === 'string' ? (
                <label className="qibi-field">
                  <span className="qibi-label">{t('foreshadowText')}</span>
                  <input className="qibi-input" value={entry.text} disabled={disabled} onChange={event => update(index, { text: event.target.value })} />
                </label>
              ) : (
                <div className="qibi-foreshadow-fields">
                  <label className="qibi-field">
                    <span className="qibi-label">{t('foreshadowTitle')}</span>
                    <input className="qibi-input" value={entry.title} disabled={disabled} onChange={event => update(index, { title: event.target.value })} />
                  </label>
                  <label className="qibi-field">
                    <span className="qibi-label">{t('foreshadowDetail')}</span>
                    <textarea className="qibi-textarea" rows={3} value={entry.detail} disabled={disabled} onChange={event => update(index, { detail: event.target.value })} />
                  </label>
                  <label className="qibi-field">
                    <span className="qibi-label">{t('foreshadowStatus')}</span>
                    <select className="qibi-select" value={entry.status} disabled={disabled} onChange={event => update(index, { status: event.target.value })}>
                      {!['open', 'resolved'].includes(entry.status) && <option value={entry.status}>{t('foreshadowStatusUnknown')} {entry.status}</option>}
                      <option value="open">{t('foreshadowOpen')}</option>
                      <option value="resolved">{t('foreshadowResolved')}</option>
                    </select>
                  </label>
                  <label className="qibi-field">
                    <span className="qibi-label">{t('foreshadowNotes')}</span>
                    <textarea className="qibi-textarea" rows={2} value={entry.notes} disabled={disabled} onChange={event => update(index, { notes: event.target.value })} />
                  </label>
                </div>
              )}
              <div className="qibi-foreshadow-actions">
                <button type="button" className="qibi-btn" disabled={disabled} onClick={() => remove(index)}>{t('foreshadowDelete')}</button>
              </div>
            </fieldset>
          ))}
          <button type="button" className="qibi-btn" disabled={disabled} onClick={add}>{t('foreshadowAdd')}</button>
        </fieldset>
      )}
      <div className="qibi-foreshadow-advanced">
        <button type="button" className="qibi-btn" aria-expanded={showRaw} aria-controls={`${hintId}-raw`} onClick={toggleAdvanced}>{t('foreshadowAdvanced')}</button>
        {showRaw && (
          <div className="qibi-foreshadow-raw" id={`${hintId}-raw`}>
            <p className="qibi-sub" id={hintId}>{t(parsed.editable ? 'foreshadowAdvancedHint' : parsed.valid ? 'foreshadowUnsupported' : 'foreshadowJsonInvalid')}</p>
            {!parsed.valid && <p className="qibi-foreshadow-error" role="alert">{t('foreshadowJsonError')} {parsed.error}</p>}
            <label className="qibi-field">
              <span className="qibi-label">{t('foreshadowRawJson')}</span>
              <textarea className="qibi-textarea qibi-foreshadow-json" aria-label={t('foreshadowRawJson')} aria-describedby={hintId} aria-invalid={!parsed.valid} rows={8} value={parsed.raw} readOnly={disabled} onChange={event => emit(event.target.value)} spellCheck={false} />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
