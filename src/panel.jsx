/**
 * 起笔写作台（浏览器半边）。
 *
 * 结构：左栏 = 作品 → 章节，右栏 = 正文 / 大纲 / 人物 / 连续性 / 检索 / 版本 / 导出。
 * 数据全部走宿主的 `/api/qibi` 精确路由（与页面其余 API 同源、自带浏览器鉴权）。
 *
 * 三条硬规则：
 * 1. 编辑有未保存内容时，切换章节/作品前先落盘；落盘冲突就停住，绝不静默丢弃。
 * 2. 磁盘上的章节被外部改动（Agent 工具或起笔本体）时，只有编辑器干净才自动跟上。
 * 3. 写入开关只能收窄：config.allowWrite=false 时界面上的开关与全部写操作都不可用。
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { NS, dictionaries } from './i18n.js'
import { STYLES } from './styles.js'
import CharacterAiDialog from './CharacterAiDialog.jsx'
import { AppearanceFrame, ThemeButton } from './Appearance.jsx'
import { runSerializedSave, flushDraft } from './draft-save.js'
import { saveCharacterEditor } from './character-editor.js'
import DistillGuide from './DistillGuide.jsx'
import { distillInstruction } from './distill-guide.js'
import ForeshadowEditor from './ForeshadowEditor.jsx'
import ContinuityOrganizer from './ContinuityOrganizer.jsx'
import { useContinuityJobs } from './continuity-jobs.js'
import NovelSettingsFields from './NovelSettingsFields.jsx'
import OutlineTab from './OutlineWorkspace.jsx'
import { novelForm, novelFormDirty, novelPayload } from './novel-settings.js'

/** 面板 id：侧栏图标与中央面板必须用同一个。 */
const PANEL_ID = 'qibi'

/** 面板与宿主之间的路径：共享 /api 通道上的精确路由（相对文档根）。 */
const API_PATH = 'api/qibi'

/** 页签定义（顺序即显示顺序）。 */
const TABS = [
  ['body', 'tabBody'],
  ['outline', 'tabOutline'],
  ['characters', 'tabCharacters'],
  ['distill', 'tabDistill'],
  ['continuity', 'tabContinuity'],
  ['search', 'tabSearch'],
  ['revisions', 'tabRevisions'],
  ['export', 'tabExport'],
]

/** AI 抽屉的常用要求预设：点一下填入，不自动执行。 */
const AI_PRESETS = ['aiPresetHook', 'aiPresetConflict', 'aiPresetPace', 'aiPresetForeshadow', 'aiPresetDialog']

const CHARACTER_FIELDS = ['name', 'alias', 'role', 'gender', 'age', 'appearance', 'personality', 'background']
const STATE_FIELDS = ['location', 'realm', 'inventory', 'statusEffects', 'recentEvents', 'keyRelationships', 'notes']

/** 侧栏图标：与 icon.svg 同一字形，跟随 currentColor。 */
export function QibiIcon({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <path d="M4 20.2c3.1 1 6 .7 8.6-.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
      <path
        d="M14.6 3.5a2.4 2.4 0 0 1 3.3 0l2.6 2.6a2.4 2.4 0 0 1 0 3.3l-6.8 6.8-6.2 1.6 1.6-6.2 6.9-6.9Z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
      />
      <path d="M13.1 5 19 10.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12.2" cy="13.4" r="1.15" fill="currentColor" />
    </svg>
  )
}

/** 把宿主返回的失败包成带 code 的 Error，便于分支处理。 */
function rpcError(failure) {
  const error = new Error(failure?.message ?? '未知错误')
  error.code = failure?.code ?? 'INTERNAL'
  error.details = failure?.details ?? {}
  return error
}

/**
 * 调一次宿主端点。
 *
 * 走 Connection 的共享 `/api` 通道（精确 Fetch 路由），因此与页面其余 API 调用同源、同样带来 cookie。
 * 不用 `ctx.connection.rpc.handle()`：那条路在未给 connection 插件注入 webServer 的宿主上挂不上路由。
 * @param {string} endpoint 端点名。
 * @param {unknown} payload 参数。
 */
async function callHost(endpoint, payload, options = {}) {
  const response = await fetch(API_PATH, {
    method: 'POST',
    signal: options.signal,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint, payload: payload ?? {} }),
  })
  if (!response.ok) {
    throw new Error(response.status === 401 || response.status === 403
      ? `宿主拒绝了这次请求（HTTP ${response.status}），请刷新页面后重试`
      : `宿主返回 HTTP ${response.status}`)
  }
  const data = await response.json()
  if (!data?.ok) throw rpcError(data?.error)
  return data.value
}

function formatWords(value) {
  return Number(value ?? 0).toLocaleString()
}

/** 面板内 AI 的流式接口：逐段回调，返回完整结果。 */
async function streamAi(payload, onDelta, signal) {
  const response = await fetch('api/qibi/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
  if (!response.ok) {
    let message = `宿主返回 HTTP ${response.status}`
    try {
      const data = await response.json()
      message = data?.error?.message ?? message
    } catch {
      // 非 JSON 响应时保留状态码。
    }
    throw new Error(message)
  }
  if (!response.body) throw new Error('宿主没有返回流式响应')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  let meta = null
  let completed = false
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let split = buffer.indexOf('\n\n')
    while (split >= 0) {
      const raw = buffer.slice(0, split)
      buffer = buffer.slice(split + 2)
      const line = raw.split('\n').find(row => row.startsWith('data: '))
      if (line) {
        let event
        try {
          event = JSON.parse(line.slice(6))
        } catch {
          event = null
        }
        if (event?.type === 'delta') {
          full += event.text
          if (onDelta) onDelta(event.text, full)
        } else if (event?.type === 'done') {
          meta = event
          completed = true
        } else if (event?.type === 'error') {
          throw new Error(event.message || '生成失败')
        }
      }
      split = buffer.indexOf('\n\n')
    }
  }
  return {
    text: meta?.text ?? full,
    rewrite: meta?.rewrite === true,
    report: meta?.report === true,
    complete: completed && meta?.truncated !== true,
    truncated: meta?.truncated === true,
  }
}

const AI_REASONING_KEY = 'qibi:ai-reasoning'

export function validReasoningPreference(info, value) {
  return typeof value === 'string' && info?.reasoning?.efforts?.some(row => row.id === value) ? value : ''
}

export function aiReasoningRequest(info, value) {
  return { modelKey: info?.model ?? '', reasoningEffort: validReasoningPreference(info, value) }
}

function reasoningLabel(row, t) {
  const keys = { none: 'aiReasoningNone', off: 'aiReasoningNone', minimal: 'aiReasoningMinimal', low: 'aiReasoningLow', medium: 'aiReasoningMedium', high: 'aiReasoningHigh', xhigh: 'aiReasoningXhigh', max: 'aiReasoningMax' }
  return keys[row.id] ? t(keys[row.id]) : row.name || row.id
}

/** A stored range is usable only while the original text and chapter still match. */
export function restoreHistorySelection(entry, draft, chapterId) {
  const range = entry?.selection
  if (!range || range.chapterId !== chapterId || typeof range.text !== 'string' || !range.text
    || !Number.isSafeInteger(range.from) || !Number.isSafeInteger(range.to)
    || range.from < 0 || range.to <= range.from || range.to > String(draft ?? '').length) return null
  return String(draft ?? '').slice(range.from, range.to) === range.text ? range : null
}

export function previewOnlyHistory(entry) {
  return Boolean(entry && (entry.previewOnly === true || (entry.mode === 'continue' && entry.forceRewrite === true && typeof entry.complete !== 'boolean')))
}

/** 面板内 AI 抽屉：模式、补充要求、流式预览与应用。 */
function AiDrawer({ call, novelId, chapterId, historyScope, draft, selection, initialMode, writable, info, modelLoading = false, hasOutline, t, notify, onApply, onClose }) {
  const [reasoningEffort, setReasoningEffort] = useState(() => validReasoningPreference(info, readJson(AI_REASONING_KEY, {})?.[info?.model]))
  const [mode, setMode] = useState('draft')
  const [extra, setExtra] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)
  const [truncated, setTruncated] = useState(false)
  const [forceRewrite, setForceRewrite] = useState(false)
  const [history, setHistory] = useState(() => listAiDrafts(chapterId, historyScope))
  const [historyEntry, setHistoryEntry] = useState(null)
  const effectiveSelection = historyEntry ? restoreHistorySelection(historyEntry, draft, chapterId) : selection
  const historyPreviewOnly = previewOnlyHistory(historyEntry)
  const abortRef = useRef(null)
  const modes = info?.modes ?? []
  const modeInfo = modes.find(row => row.id === mode)
  const isSelectionMode = modeInfo?.group === 'selection'
  const isReportMode = modeInfo?.group === 'report'
  const reasoning = info?.reasoning
  const inheritedEffort = reasoning?.selectedEffort ?? reasoning?.defaultEffort
  const inheritedRow = reasoning?.efforts?.find(row => row.id === inheritedEffort)

  useEffect(() => {
    setReasoningEffort(validReasoningPreference(info, readJson(AI_REASONING_KEY, {})?.[info?.model]))
  }, [info])

  const chooseReasoning = event => {
    const next = validReasoningPreference(info, event.target.value)
    setReasoningEffort(next)
    if (info?.model) writeJson(AI_REASONING_KEY, { ...readJson(AI_REASONING_KEY, {}), [info.model]: next })
  }

  useEffect(() => {
    if (selection) setMode(initialMode || 'polish-selection')
    else setMode(prev => (modes.some(row => row.id === prev) ? prev : 'draft'))
    // 只在抽屉打开/换选区时重置模式。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, initialMode])

  useEffect(() => () => { abortRef.current?.abort?.() }, [])

  useEffect(() => { setHistory(listAiDrafts(chapterId, historyScope)) }, [chapterId, historyScope])

  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const onKey = event => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      abortRef.current?.abort?.()
      closeRef.current?.()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  const generate = async () => {
    if (busy || modelLoading || novelId == null) return
    if (isSelectionMode && !effectiveSelection) {
      notify('error', t('aiNeedSelection'))
      return
    }
    if (!isSelectionMode) setHistoryEntry(null)
    setBusy(true)
    setPreview('')
    setError('')
    setComplete(false)
    setTruncated(false)
    setForceRewrite(false)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const result = await streamAi({
        ...aiReasoningRequest(info, reasoningEffort),
        mode,
        novelId,
        chapterId,
        content: isSelectionMode ? effectiveSelection.text : draft,
        extra,
      }, (_delta, full) => setPreview(full), controller.signal)
      setPreview(result.text)
      setComplete(result.complete === true)
      setTruncated(result.truncated === true)
      if (chapterId != null && String(result.text ?? '').trim()) {
        setHistory(saveAiDraft(chapterId, {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          mode,
          label: modeInfo?.label ?? mode,
          text: result.text,
          at: Date.now(),
          truncated: result.truncated === true,
          complete: result.complete === true,
          selection: isSelectionMode && effectiveSelection ? { chapterId, from: effectiveSelection.from, to: effectiveSelection.to, text: effectiveSelection.text } : null,
          forceRewrite: false,
        }, historyScope))
      }
    } catch (cause) {
      if (controller.signal.aborted) setError(t('aiCancelled'))
      else setError(causeText(cause))
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  const cancel = () => {
    abortRef.current?.abort?.()
    abortRef.current = null
    setBusy(false)
  }

  // 截断或中断后，把已生成部分当作当前正文继续续写，拼成完整草稿。
  const continueWriting = async () => {
    if (busy || modelLoading || historyPreviewOnly || !preview.trim() || chapterId == null) return
    setBusy(true)
    setError('')
    const controller = new AbortController()
    abortRef.current = controller
    const base = preview
    const join = value => `${base}${base.endsWith('\n') || !value ? '' : '\n'}${value}`
    try {
      const result = await streamAi({
        ...aiReasoningRequest(info, reasoningEffort),
        mode: 'continue',
        novelId,
        chapterId,
        content: base,
        extra,
      }, (_delta, full) => setPreview(join(full)), controller.signal)
      const merged = join(result.text)
      setPreview(merged)
      setComplete(result.complete === true)
      setTruncated(result.truncated === true)
      setForceRewrite(true)
      if (String(result.text ?? '').trim()) {
        setHistory(saveAiDraft(chapterId, {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          mode: isSelectionMode ? mode : 'continue',
          label: t('aiContinue'),
          text: merged,
          at: Date.now(),
          truncated: result.truncated === true,
          complete: result.complete === true,
          selection: isSelectionMode && effectiveSelection ? { chapterId, from: effectiveSelection.from, to: effectiveSelection.to, text: effectiveSelection.text } : null,
          forceRewrite: true,
        }, historyScope))
      }
    } catch (cause) {
      if (controller.signal.aborted) setError(t('aiCancelled'))
      else setError(causeText(cause))
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  const copy = async () => {
    if (!preview) return
    try {
      await navigator.clipboard.writeText(preview)
      notify('info', t('exportCopied'))
    } catch (cause) {
      notify('error', causeText(cause))
    }
  }

  return (
    <>
    <div className="qibi-ai-overlay" onClick={onClose} />
    <div
      className="qibi-ai-drawer"
      role="dialog"
      aria-modal="true"
      aria-label={t('aiTitle')}
      onClick={event => event.stopPropagation()}
    >
      <div className="qibi-ai-head">
        <strong>{t('aiTitle')}</strong>
        <span className="qibi-spacer" />
        <button type="button" className="qibi-btn small qibi-ai-close" onClick={onClose} title={t('close')} aria-label={t('close')}>{t('close')}</button>
      </div>

      <div className="qibi-row qibi-ai-model-settings" aria-busy={modelLoading}>
        <Field label={t('aiGenerationModel')}>
          <span className="qibi-sub qibi-ai-model" title={info?.model ?? ''}>{modelLoading ? t('aiModelLoading') : info?.model || t('aiUnavailable')}</span>
        </Field>
        <Field label={t('aiReasoning')}>
          <select className="qibi-select" aria-label={t('aiReasoning')} value={validReasoningPreference(info, reasoningEffort)} onChange={chooseReasoning} disabled={busy || modelLoading || !reasoning?.supported}>
            <option value="">{t('aiReasoningFollow')}{inheritedRow ? ` · ${reasoningLabel(inheritedRow, t)}` : ''}</option>
            {(reasoning?.efforts ?? []).map(row => <option key={row.id} value={row.id} title={row.description}>{reasoningLabel(row, t)}</option>)}
          </select>
        </Field>
      </div>
      {!modelLoading && <div className="qibi-sub">{reasoning?.supported ? t('aiReasoningHint') : reasoning?.known ? t('aiReasoningUnsupported') : t('aiReasoningUnknown')}</div>}

      {chapterId != null && hasOutline === false && (
        <div className="qibi-ai-note">{t('aiNoOutline')}</div>
      )}

      {isSelectionMode && effectiveSelection && (
        <div className="qibi-ai-selection">
          <span className="qibi-sub">{t('aiSelectionLabel')}</span>
          <div className="qibi-ai-selected">“{effectiveSelection.text.slice(0, 120)}{effectiveSelection.text.length > 120 ? '…' : ''}”</div>
        </div>
      )}
      {isSelectionMode && !effectiveSelection && <div className="qibi-ai-note">{t('aiHistorySelectionMissing')}</div>}
      {historyPreviewOnly && <div className="qibi-ai-note">{t(historyEntry?.legacyScope ? 'aiHistoryLegacyScope' : 'aiHistoryLegacyContinuation')}</div>}

      <div className="qibi-ai-modes">
        {['chapter', 'selection', 'report'].map(group => (
          <div className="qibi-ai-mode-group" key={group}>
            <span className="qibi-sub">{t(group === 'chapter' ? 'aiGroupChapter' : group === 'selection' ? 'aiGroupSelection' : 'aiGroupReport')}</span>
            <div className="qibi-actions">
              {modes.filter(row => row.group === group).map(row => (
                <button
                  type="button"
                  key={row.id}
                  className={`qibi-btn small${mode === row.id ? ' primary' : ''}`}
                  disabled={busy || (row.group === 'selection' && !selection)}
                  onClick={() => { setMode(row.id); setHistoryEntry(null); setPreview(''); setError('') }}
                >{row.label}</button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Field label={t('aiExtra')}>
        <textarea className="qibi-textarea" rows={2} value={extra} onChange={event => setExtra(event.target.value)} placeholder={t('aiExtraHint')} />
      </Field>

      <div className="qibi-presets">
        {AI_PRESETS.map(key => (
          <button
            type="button"
            key={key}
            className="qibi-chip"
            onClick={() => setExtra(previous => (previous ? `${previous}；${t(key)}` : t(key)))}
          >{t(key)}</button>
        ))}
      </div>

      <div className="qibi-actions">
        <button type="button" className="qibi-btn small primary" disabled={busy || modelLoading || !info?.available || (isSelectionMode && !effectiveSelection)} onClick={() => void generate()}>
          {busy ? t('aiGenerating') : t('aiGenerate')}
        </button>
        {busy && <button type="button" className="qibi-btn small" onClick={cancel}>{t('cancel')}</button>}
        {preview && !busy && !complete && !historyPreviewOnly && (
          <button type="button" className="qibi-btn small" disabled={modelLoading} onClick={() => void continueWriting()}>{t('aiContinue')}</button>
        )}
        {preview && !busy && (
          <>
            <button type="button" className="qibi-btn small" onClick={() => void copy()}>{t('exportCopy')}</button>
            {isReportMode
              ? (modeInfo?.saveAsOutline === false
                ? null
                : <button type="button" className="qibi-btn small" disabled={!writable || !complete || historyPreviewOnly} onClick={() => onApply({ sourceNovelId: novelId, sourceChapterId: chapterId, mode, modeLabel: modeInfo?.label, text: preview, report: true })}>{t('aiSaveOutline')}</button>)
              : <button type="button" className="qibi-btn small primary" disabled={!writable || !complete || historyPreviewOnly || (isSelectionMode && !effectiveSelection) || (historyEntry && !modes.some(row => row.id === historyEntry.mode))} onClick={() => onApply({ sourceNovelId: novelId, sourceChapterId: chapterId, mode, modeLabel: modeInfo?.label, text: preview, rewrite: forceRewrite ? true : modeInfo?.rewrite !== false, selection: isSelectionMode ? effectiveSelection : null })}>{t('aiApply')}</button>}
          </>
        )}
        <span className="qibi-spacer" />
        <span className="qibi-sub">{preview ? `${preview.replace(/\s/g, '').length} ${t('words')}` : ''}</span>
      </div>

      {!info?.available && <div className="qibi-error-text">{t('aiUnavailable')}</div>}
      {preview && !busy && !complete && !historyPreviewOnly && (
        <div className="qibi-error-text">{truncated ? t('aiTruncated') : t('aiIncomplete')}</div>
      )}
      {error && <div className="qibi-error-text">{error}</div>}

      <div className="qibi-ai-preview">
        {preview
          ? <pre className="qibi-pre">{preview}</pre>
          : <div className="qibi-sub">{busy ? t('aiWaiting') : t('aiPreviewHint')}</div>}
      </div>

      {history.length > 0 && (
        <div className="qibi-drafts">
          <div className="qibi-row">
            <span className="qibi-sub">{t('aiHistory')} · {history.length}</span>
            <span className="qibi-spacer" />
            <button
              type="button"
              className="qibi-btn small"
              onClick={() => { clearAiDrafts(chapterId, historyScope); setHistory([]) }}
            >{t('aiHistoryClear')}</button>
          </div>
          {history.map(item => (
            <div className="qibi-draft" key={item.id}>
              <button
                type="button"
                className="qibi-draft-main"
                disabled={busy}
                title={t('aiHistoryLoad')}
                onClick={() => {
                  if (modes.some(row => row.id === item.mode)) setMode(item.mode)
                  setHistoryEntry(item)
                  setPreview(item.text)
                  setError('')
                  setComplete(item.complete !== false && item.truncated !== true)
                  setTruncated(item.truncated === true)
                  setForceRewrite(item.forceRewrite === true)
                }}
              >
                <span>{item.label || item.mode}</span>
                <span className="qibi-sub">{new Date(item.at).toLocaleString()} · {item.text.replace(/\s/g, '').length} {t('words')}</span>
              </button>
              <button
                type="button"
                className="qibi-btn small"
                aria-label={t('delete')}
                onClick={() => setHistory(removeAiDraft(chapterId, item.id, historyScope))}
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}
/** 分块上传用：Uint8Array → base64（避免大数组 spread 爆栈）。 */
function bytesToBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

/** 面板偏好：localStorage 不可用时静默降级。 */
function readFlag(key) {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeFlag(key, on) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, on ? '1' : '0')
  } catch {
    // 隐私模式等场景忽略即可。
  }
}

function readJson(key, fallback) {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 同上，偏好丢失不影响正文。
  }
}

const AI_DRAFTS_KEY = 'qibi:ai-drafts'
const AI_DRAFTS_PER_CHAPTER = 10
const AI_DRAFTS_TOTAL = 40

/** 面板内 AI 生成历史：按章节存在本机，关闭抽屉也不丢。 */
function loadDraftStore() {
  const value = readJson(AI_DRAFTS_KEY, {})
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).filter(([, rows]) => Array.isArray(rows)).map(([key, rows]) => [key,
    rows.filter(row => row && typeof row.id === 'string' && typeof row.mode === 'string' && typeof row.text === 'string').map(row => ({
      ...row, label: typeof row.label === 'string' ? row.label : row.mode,
      at: typeof row.at === 'number' && Number.isFinite(row.at) ? row.at : 0,
    })),
  ]))
}

function draftBucket(chapterId, scope) {
  return scope ? JSON.stringify([String(scope), chapterId]) : String(chapterId)
}

export function listAiDrafts(chapterId, scope) {
  if (chapterId == null) return []
  const store = loadDraftStore()
  const current = store[draftBucket(chapterId, scope)] ?? []
  if (!scope) return current
  const legacy = (store[String(chapterId)] ?? []).map(row => ({ ...row, previewOnly: true, legacyScope: true }))
  return [...current, ...legacy]
}

export function saveAiDraft(chapterId, entry, scope) {
  if (chapterId == null) return []
  const store = loadDraftStore()
  const key = draftBucket(chapterId, scope)
  const list = store[key] ?? []
  store[key] = [entry, ...list].slice(0, AI_DRAFTS_PER_CHAPTER)
  const all = []
  for (const [chapterKey, rows] of Object.entries(store)) {
    for (const row of rows) all.push({ chapterKey, id: row.id, at: row.at ?? 0 })
  }
  all.sort((a, b) => b.at - a.at)
  for (const extra of all.slice(AI_DRAFTS_TOTAL)) {
    store[extra.chapterKey] = (store[extra.chapterKey] ?? []).filter(row => row.id !== extra.id)
  }
  writeJson(AI_DRAFTS_KEY, store)
  return listAiDrafts(chapterId, scope)
}

export function removeAiDraft(chapterId, id, scope) {
  if (chapterId == null) return []
  const store = loadDraftStore()
  for (const key of new Set([draftBucket(chapterId, scope), String(chapterId)])) {
    store[key] = (store[key] ?? []).filter(row => row.id !== id)
    if (store[key].length === 0) delete store[key]
  }
  writeJson(AI_DRAFTS_KEY, store)
  return listAiDrafts(chapterId, scope)
}

export function clearAiDrafts(chapterId, scope) {
  if (chapterId == null) return
  const store = loadDraftStore()
  delete store[draftBucket(chapterId, scope)]
  delete store[String(chapterId)]
  writeJson(AI_DRAFTS_KEY, store)
}

/**
 * 细纲锚点：自定义 marker 优先，否则取标题前 8 字；只匹配当前章节的细纲。
 * 返回 pos=-1 表示正文里还没写到这个锚点。
 */
export function matchOutlineAnchors(draft, outlines, markers, chapterId) {
  if (chapterId == null) return []
  const text = String(draft ?? '')
  return (outlines ?? [])
    .filter(row => row.chapterId === chapterId)
    .map(row => {
      const custom = String(markers?.[row.id] ?? '').trim()
      const fallback = String(row.title ?? '').trim().slice(0, 8)
      const marker = custom || fallback
      const pos = marker ? text.indexOf(marker) : -1
      return { id: row.id, title: row.title || '', marker, pos, done: pos >= 0, custom: Boolean(custom) }
    })
}

const HISTORY_LIMIT = 200

/** 撤销历史：past 的最后一项是「当前正文之前」的快照。 */
export function createHistory() {
  return { past: [], future: [], lastText: '', lastAt: 0 }
}

function trimHistory(list) {
  if (list.length > HISTORY_LIMIT) list.shift()
}

/** 程序化改写（AI / 排版 / 替换 / 插入）：整段记一次。 */
export function pushHistory(history, before, after) {
  if (after === before) return
  history.past.push(before)
  trimHistory(history.past)
  history.future.length = 0
  history.lastText = after
  history.lastAt = 0
}

/** 手动输入：停顿超过 gap 才落快照，连续输入合并成一次撤销。 */
export function pushTypingHistory(history, before, after, now, gap = 700) {
  if (!history.lastText || now - history.lastAt > gap) {
    history.past.push(history.lastText || before)
    trimHistory(history.past)
    history.future.length = 0
  }
  history.lastText = after
  history.lastAt = now
}

/** 返回要恢复的文本；没有历史时返回 null。 */
export function undoHistory(history, current) {
  if (history.past.length === 0) return null
  const previous = history.past.pop()
  history.future.push(current)
  trimHistory(history.future)
  history.lastText = previous
  history.lastAt = 0
  return previous
}

export function redoHistory(history, current) {
  if (history.future.length === 0) return null
  const next = history.future.pop()
  history.past.push(current)
  trimHistory(history.past)
  history.lastText = next
  history.lastAt = 0
  return next
}

function chapterStatusOptions(current) {
  const options = ['草稿', '已发布']
  const value = typeof current === 'string' ? current.trim() : ''
  if (value && !options.includes(value)) options.push(value)
  return options
}

function emptyCharacter() {
  const form = {}
  for (const key of CHARACTER_FIELDS) form[key] = ''
  return form
}

function emptyCharacterState() {
  const state = {}
  for (const key of STATE_FIELDS) state[key] = ''
  return state
}

function stateToForm(state) {
  return {
    location: state?.location ?? '',
    realm: state?.realm ?? '',
    inventory: state?.inventory ?? '',
    statusEffects: state?.statusEffects ?? '',
    recentEvents: state?.recentEvents ?? '',
    keyRelationships: state?.keyRelationships ?? '',
    notes: state?.notes ?? '',
  }
}

function causeText(cause) {
  return cause instanceof Error ? cause.message : String(cause)
}

/** 表单字段容器。 */
function Field({ label, children }) {
  return (
    <label className="qibi-field">
      <span className="qibi-label">{label}</span>
      {children}
    </label>
  )
}

/** 面板内模态框。 */
function Dialog({ title, onClose, children, footer, busy = false, className = '' }) {
  const element = useRef(null)
  const close = useRef(onClose)
  const locked = useRef(busy)
  close.current = onClose
  locked.current = busy
  const titleId = useId()
  useEffect(() => {
    const trigger = document.activeElement
    element.current?.focus()
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!locked.current) close.current() }
      if (event.key !== 'Tab' || !element.current) return
      const controls = Array.from(element.current.querySelectorAll('button, input, textarea, select, summary, a[href], [tabindex="0"]')).filter(node => !node.matches(':disabled') && node.getClientRects().length)
      const first = controls[0], last = controls[controls.length - 1]
      if (!first) { event.preventDefault(); element.current.focus() }
      else if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement))) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('keydown', onKey, true); if (trigger?.isConnected) trigger.focus() }
  }, [])
  return <div className="qibi-overlay" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <div ref={element} className={`qibi-dialog${className ? ` ${className}` : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} tabIndex={-1}>
      <div className="qibi-dialog-head"><strong id={titleId}>{title}</strong><span className="qibi-spacer" /><button type="button" className="qibi-btn small" disabled={busy} aria-label={title + ' · 关闭'} onClick={onClose}>×</button></div>
      <div className="qibi-dialog-body"><fieldset className="qibi-form-lock" disabled={busy}>{children}</fieldset></div>
      {footer ? <div className="qibi-dialog-foot">{footer}</div> : null}
    </div>
  </div>
}

/** 页签加载失败：说明 + 重试，避免一直停在「加载中」。 */
function LoadError({ message, onRetry, t }) {
  return (
    <div className="qibi-empty">
      <strong>{t('loadFailed')}</strong>
      <span>{message}</span>
      <div style={{ marginTop: 12 }}>
        <button type="button" className="qibi-btn" onClick={onRetry}>{t('retry')}</button>
      </div>
    </div>
  )
}

/** 人物：设定卡 + 动态账本。 */
function CharactersTab({ call, novelId, chapterId, writable, active, notify, t, guard }) {
  const [characters, setCharacters] = useState(null)
  const [aiAction, setAiAction] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (novelId === null) return
    try {
      const result = await call('characters', { novelId })
      setCharacters(result.characters)
      setError(null)
    } catch (cause) {
      setError(causeText(cause))
    }
  }, [call, novelId])

  useEffect(() => {
    setCharacters(null)
    setAiAction(null)
    setDialog(null)
    setError(null)
  }, [novelId])

  useEffect(() => { if (!active) setAiAction(null) }, [active])

  useEffect(() => {
    if (active) void load()
  }, [active, load])

  const openCharacterAi = async action => {
    if (guard && !(await guard())) return
    setAiAction(action)
  }

  const openCreate = () => {
    setDialog({ id: null, token: null, stateToken: null, form: emptyCharacter(), state: emptyCharacterState(), stateExists: false, loadingState: false, stateLoadError: false, busy: false })
  }

  const openEdit = async row => {
    setDialog({ id: row.id, token: row.token ?? null, stateToken: null, form: { ...emptyCharacter(), ...pick(row) }, state: emptyCharacterState(), stateExists: false, loadingState: true, stateLoadError: false, busy: false })
    try {
      const state = await call('characterState', { characterId: row.id })
      setDialog(current => (current && current.id === row.id
        ? { ...current, state: stateToForm(state), stateToken: state.token ?? null, stateExists: state.exists === true, loadingState: false, stateLoadError: false }
        : current))
    } catch (cause) {
      notify('error', causeText(cause))
      setDialog(current => (current?.id === row.id ? { ...current, loadingState: false, stateLoadError: true } : current))
    }
  }

  const setField = (key, value) => setDialog(current => (current
    ? { ...current, form: { ...current.form, [key]: value } }
    : current))

  const setStateField = (key, value) => setDialog(current => (current
    ? { ...current, state: { ...current.state, [key]: value } }
    : current))

  const save = async () => {
    if (!dialog || dialog.busy || dialog.loadingState || dialog.stateLoadError) return
    if (!dialog.form.name.trim()) {
      notify('error', t('nameRequired'))
      return
    }
    setDialog(current => (current ? { ...current, busy: true } : current))
    try {
      await saveCharacterEditor({ call, novelId, dialog, onProgress: next => setDialog(previous => previous ? { ...next, busy: true } : previous) })

      await load()
      setDialog(null)
      notify('info', t('savedNotice'))
    } catch (cause) {
      if (cause?.code === 'ENTITY_CONFLICT') {
        notify('error', t('entityConflict'))
        setDialog(current => current ? { ...current, busy: false } : current)
      } else {
        notify('error', causeText(cause))
        setDialog(current => (current ? { ...current, busy: false } : current))
      }
    }
  }

  const remove = async row => {
    if (!window.confirm(t('confirmDeleteCharacter'))) return
    try {
      await call('deleteCharacter', { characterId: row.id })
      await load()
      notify('info', t('deletedNotice'))
    } catch (cause) {
      notify('error', causeText(cause))
    }
  }

  return (
    <div className="qibi-pane">
      <div className="qibi-row">
        <span className="qibi-section-title">{t('tabCharacters')}</span>
        <span className="qibi-spacer" />
        <button type="button" className="qibi-btn small" onClick={() => void openCharacterAi('extract')}>{t('characterAiExtractTitle')}</button>
        <button type="button" className="qibi-btn small" onClick={() => void openCharacterAi('generate')}>{t('characterAiGenerateTitle')}</button>
        <button type="button" className="qibi-btn small" disabled={!writable} onClick={openCreate}>＋ {t('characterNew')}</button>
      </div>

      {error && <LoadError message={error} onRetry={() => void load()} t={t} />}
      {!error && characters === null && <div className="qibi-sub">{t('loading')}</div>}
      {!error && characters !== null && characters.length === 0 && (
        <div className="qibi-empty">
          <strong>{t('emptyCharacters')}</strong>
          <span>{t('emptyCharactersHint')}</span>
          {writable && (
            <div style={{ marginTop: 12 }}>
              <button type="button" className="qibi-btn" onClick={openCreate}>＋ {t('characterNew')}</button>
            </div>
          )}
        </div>
      )}
      {!error && (characters ?? []).map(row => (
        <div className="qibi-card" key={row.id}>
          <div className="qibi-row">
            <h4>{row.name}{row.role ? ` · ${row.role}` : ''}</h4>
            {row.alias && <span className="qibi-tag">{row.alias}</span>}
            <span className="qibi-spacer" />
            <button type="button" className="qibi-btn small" disabled={!writable} onClick={() => void openEdit(row)}>{t('edit')}</button>
            <button type="button" className="qibi-btn small danger" disabled={!writable} onClick={() => void remove(row)}>{t('delete')}</button>
          </div>
          {[row.gender, row.age].filter(Boolean).length > 0 && <p>{[row.gender, row.age].filter(Boolean).join(' · ')}</p>}
          {row.personality && <p>{t('characterPersonality')}：{row.personality}</p>}
          {row.background && <p>{t('characterBackground')}：{row.background}</p>}
          {(row.location || row.realm) && <p>{t('stateSection')}：{[row.location, row.realm].filter(Boolean).join(' · ')}</p>}
        </div>
      ))}

      {aiAction && (
        <CharacterAiDialog
          key={`${novelId}:${chapterId ?? 'all'}:${aiAction}`}
          call={call} novelId={novelId} chapterId={chapterId} characters={characters ?? []}
          writable={writable} initialAction={aiAction} t={t}
          onClose={() => setAiAction(null)}
          onImported={async result => {
            setCharacters(result.characters)
            notify('info', `${t('characterAiCreated')} ${result.created} · ${t('characterAiSkipped')} ${result.skipped}`)
          }}
        />
      )}

      {dialog && (
        <Dialog
          title={dialog.id === null ? t('characterNew') : t('edit')}
          busy={dialog.busy}
          onClose={() => { if (!dialog.busy) setDialog(null) }}
          footer={(
            <>
              <span className="qibi-spacer" />
              <button type="button" className="qibi-btn small" disabled={dialog.busy} onClick={() => setDialog(null)}>{t('cancel')}</button>
              <button type="button" className="qibi-btn small primary" disabled={dialog.busy || dialog.loadingState || dialog.stateLoadError} onClick={() => void save()}>{t('save')}</button>
            </>
          )}
        >
          <div className="qibi-form">
            {CHARACTER_FIELDS.map(key => (
              <Field key={key} label={t(`character${key[0].toUpperCase()}${key.slice(1)}`)}>
                {key === 'background' || key === 'appearance' || key === 'personality'
                  ? (
                    <textarea
                      className="qibi-textarea"
                      rows={3}
                      value={dialog.form[key]}
                      onChange={event => setField(key, event.target.value)}
                    />
                  )
                  : (
                    <input
                      className="qibi-input"
                      value={dialog.form[key]}
                      onChange={event => setField(key, event.target.value)}
                    />
                  )}
              </Field>
            ))}
            <h4 className="qibi-form-title">{t('stateSection')}</h4>
            {dialog.stateLoadError && <div className="qibi-error-text" role="alert">{t('characterStateReadFailed')} <button type="button" className="qibi-btn small" onClick={() => void openEdit({ ...dialog.form, id: dialog.id, token: dialog.token })}>{t('retry')}</button></div>}
            {dialog.loadingState
              ? <div className="qibi-sub">{t('loading')}</div>
              : STATE_FIELDS.map(key => (
                <Field key={key} label={t(`state${key[0].toUpperCase()}${key.slice(1)}`)}>
                  <textarea
                    className="qibi-textarea"
                    rows={2}
                    value={dialog.state[key]}
                    onChange={event => setStateField(key, event.target.value)}
                  />
                </Field>
              ))}
          </div>
        </Dialog>
      )}
    </div>
  )
}

/** 蒸馏作者：素材、DSH Agent 生成、版本与绑定。 */
function DistillTab({ call, novelId, writable, active, notify, t }) {
  const [authors, setAuthors] = useState(null)
  const [authorsError, setAuthorsError] = useState('')
  const [authorId, setAuthorId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [binding, setBinding] = useState(null)
  const [detailError, setDetailError] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteName, setPasteName] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [instruction, setInstruction] = useState('')
  const [instructionCopied, setInstructionCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)
  const detailSeq = useRef(0)
  const authorRef = useRef(authorId)
  authorRef.current = authorId

  const loadAuthors = useCallback(async () => {
    setAuthorsError('')
    try {
      const result = await call('distilledAuthors', {})
      const list = Array.isArray(result) ? result : (result?.authors ?? [])
      setAuthors(list)
      setAuthorId(previous => (previous != null && list.some(author => author.id === previous) ? previous : (list[0]?.id ?? null)))
    } catch (cause) {
      setAuthorsError(causeText(cause))
      notify('error', causeText(cause))
    }
  }, [call, notify])

  const loadDetail = useCallback(async id => {
    const sequence = ++detailSeq.current
    setDetailError('')
    if (id == null || id !== authorRef.current) {
      setDetail(null)
      return
    }
    try {
      const result = await call('distilledAuthor', { authorId: id })
      if (sequence === detailSeq.current && authorRef.current === id) setDetail(result)
    } catch (cause) {
      if (sequence === detailSeq.current && authorRef.current === id) setDetailError(causeText(cause))
    }
  }, [call, notify])

  const loadBinding = useCallback(async () => {
    if (novelId == null) {
      setBinding(null)
      return
    }
    try {
      const result = await call('writerState', { novelId })
      setBinding(result.writerState)
    } catch (cause) {
      notify('error', causeText(cause))
    }
  }, [call, novelId, notify])

  useEffect(() => {
    if (active) void loadAuthors()
  }, [active, loadAuthors])

  useEffect(() => {
    if (!active) return
    setDetail(null)
    setPreview(null)
    setInstruction('')
    setInstructionCopied(false)
    void loadDetail(authorId)
  }, [active, authorId, loadDetail])

  useEffect(() => {
    if (active) void loadBinding()
  }, [active, loadBinding])

  const createAuthor = async () => {
    const name = newName.trim()
    if (!name || busy) return
    setBusy(true)
    try {
      const author = await call('createDistilledAuthor', { name })
      setCreating(false)
      setNewName('')
      await loadAuthors()
      setAuthorId(author.id)
      notify('info', t('distillCreated'))
    } catch (cause) {
      notify('error', causeText(cause))
    } finally {
      setBusy(false)
    }
  }

  const deleteAuthor = async () => {
    if (!detail || busy || !window.confirm(t('confirmDeleteDistillAuthor'))) return
    setBusy(true)
    try {
      await call('deleteDistilledAuthor', { authorId: detail.id })
      setDetail(null)
      await loadAuthors()
      await loadBinding()
      notify('info', t('distillDeleted'))
    } catch (cause) {
      notify('error', causeText(cause))
    } finally {
      setBusy(false)
    }
  }

  const uploadFiles = async fileList => {
    const files = [...(fileList ?? [])]
    if (!files.length || authorId == null || detail?.id !== authorId || busy) return
    setBusy(true)
    try {
      for (const file of files) {
        if (!file.size) {
          notify('error', `${file.name}: ${t('distillEmptyFile')}`)
          continue
        }
        const format = (file.name.split('.').pop() || 'txt').toLowerCase()
        setUploading({ filename: file.name, percent: 0 })
        const init = await call('initDistilledSource', { authorId, filename: file.name, format, sizeBytes: file.size })
        const bytes = new Uint8Array(await file.arrayBuffer())
        const chunkSize = 512 * 1024
        let offset = 0
        while (offset < bytes.length) {
          const end = Math.min(bytes.length, offset + chunkSize)
          await call('appendDistilledSource', {
            sourceId: init.sourceId,
            offset,
            base64: bytesToBase64(bytes.subarray(offset, end)),
          })
          offset = end
          setUploading({ filename: file.name, percent: Math.round((offset / bytes.length) * 100) })
        }
        await call('completeDistilledSource', { sourceId: init.sourceId })
        setUploading(null)
      }
      await loadDetail(authorId)
      await loadAuthors()
      notify('info', t('distillUploaded'))
    } catch (cause) {
      notify('error', causeText(cause))
      setUploading(null)
      void loadDetail(authorId)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const addPaste = async () => {
    if (!pasteText.trim() || authorId == null || detail?.id !== authorId || busy) return
    setBusy(true)
    try {
      await call('addDistilledText', {
        authorId,
        filename: pasteName.trim() || '粘贴材料.txt',
        text: pasteText,
      })
      setPasteOpen(false)
      setPasteName('')
      setPasteText('')
      await loadDetail(authorId)
      await loadAuthors()
      notify('info', t('distillUploaded'))
    } catch (cause) {
      notify('error', causeText(cause))
    } finally {
      setBusy(false)
    }
  }

  const deleteSource = async source => {
    if (busy || !window.confirm(t('confirmDeleteDistillSource'))) return
    setBusy(true)
    try {
      await call('deleteDistilledSource', { sourceId: source.id })
      await loadDetail(authorId)
      await loadAuthors()
      notify('info', t('distillDeleted'))
    } catch (cause) {
      notify('error', causeText(cause))
    } finally {
      setBusy(false)
    }
  }

  const copyInstruction = async () => {
    if (!detail || detail.id !== authorId) return
    const text = distillInstruction(detail)
    setInstruction(text)
    setInstructionCopied(false)
    try {
      await navigator.clipboard.writeText(text)
      if (authorRef.current !== detail.id) return
      setInstructionCopied(true)
      notify('info', t('distillInstructionCopied'))
    } catch {
      if (authorRef.current === detail.id) notify('info', t('distillCopyManual'))
    }
  }

  const rollback = async version => {
    if (!detail || busy || !window.confirm(t('confirmRollbackVersion'))) return
    setBusy(true)
    try {
      await call('rollbackDistilledVersion', { authorId: detail.id, versionId: version.id })
      await loadDetail(detail.id)
      await loadAuthors()
      notify('info', t('savedNotice'))
    } catch (cause) {
      notify('error', causeText(cause))
    } finally {
      setBusy(false)
    }
  }

  const bindAuthor = async id => {
    if (novelId == null || busy) return
    setBusy(true)
    try {
      const result = await call('bindDistilledAuthor', { novelId, authorId: id })
      setBinding(result.writerState)
      notify('info', id == null ? t('distillUnbound') : t('distillApplied'))
    } catch (cause) {
      notify('error', causeText(cause))
    } finally {
      setBusy(false)
    }
  }

  const boundAuthor = authors?.find(author => author.id === binding?.distilledAuthorId) ?? null
  const isBound = detail ? binding?.distilledAuthorId === detail.id : false

  return (
    <div className="qibi-distill">
      <div className="qibi-distill-list">
        <div className="qibi-side-head">
          <span>{t('distillAuthors')}</span>
          <span className="qibi-spacer" />
          <button
            type="button"
            className="qibi-btn small"
            disabled={!writable || busy}
            title={t('distillNew')}
            onClick={() => { setCreating(value => !value); setNewName('') }}
          >＋</button>
        </div>
        {creating && (
          <div className="qibi-newrow">
            <input
              autoFocus
              className="qibi-input"
              value={newName} disabled={busy}
              placeholder={t('distillNamePlaceholder')}
              onChange={event => setNewName(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') void createAuthor()
                if (event.key === 'Escape') { setCreating(false); setNewName('') }
              }}
            />
            <button type="button" className="qibi-btn small primary" disabled={busy || !newName.trim()} onClick={() => void createAuthor()}>✓</button>
          </div>
        )}
        <div className="qibi-list">
          {authorsError && <div className="qibi-error-text" role="alert">{authorsError} <button type="button" className="qibi-btn small" onClick={() => void loadAuthors()}>{t('retry')}</button></div>}
          {!authorsError && authors === null && <div className="qibi-sub" style={{ padding: '8px' }}>{t('loading')}</div>}
          {authors !== null && authors.length === 0 && <div className="qibi-sub" style={{ padding: '8px' }}>{t('distillEmpty')}</div>}
          {(authors ?? []).map(author => (
            <button
              type="button"
              key={author.id}
              className={`qibi-author-btn${author.id === authorId ? ' active' : ''}`}
              disabled={busy}
              onClick={() => { if (author.id === authorId) return; setDetail(null); setAuthorId(author.id) }}
            >
              <span className="qibi-author-name">{author.name}</span>
              <span className="qibi-author-meta">{author.sourceCount} {t('distillSourceCount')} · {author.currentVersion ? `v${author.currentVersion.version}` : t('distillNoVersion')}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="qibi-distill-main">
        <DistillGuide
          detail={detail?.id === authorId ? detail : null}
          loading={authors === null || (authorId != null && detail?.id !== authorId && !detailError)}
          writable={writable} busy={busy} boundAuthorId={binding?.distilledAuthorId} novelId={novelId} t={t}
          onCreate={() => setCreating(true)}
          onAddMaterials={() => setPasteOpen(true)}
          onCopyInstruction={() => void copyInstruction()}
          onBind={() => { if (detail?.id === authorId) void bindAuthor(detail.id) }}
        />
        {detailError && <LoadError message={detailError} onRetry={() => void loadDetail(authorId)} t={t} />}
        {!detailError && (!detail || detail.id !== authorId) && (
          <div className="qibi-empty">
            <strong>{t(authorId == null ? 'distillEmpty' : 'loading')}</strong>
            <span>{t('distillStartHint')}</span>
          </div>
        )}
        {detail && detail.id === authorId && (
          <>
            <div className="qibi-row">
              <h3 className="qibi-distill-title">{detail.name}</h3>
              <span className="qibi-tag">{detail.status}</span>
              <span className="qibi-sub">{t('distillCurrentVersion')} {detail.currentVersion ? `v${detail.currentVersion.version}` : t('distillNoVersion')}</span>
              <span className="qibi-spacer" />
              <button type="button" className="qibi-btn small" onClick={() => { void loadDetail(detail.id); void loadAuthors(); void loadBinding() }}>{t('refresh')}</button>
              <button type="button" className="qibi-btn small danger" disabled={!writable || busy} onClick={() => void deleteAuthor()}>{t('delete')}</button>
            </div>

            <div className="qibi-row qibi-binding">
              <span className="qibi-sub">{boundAuthor ? `${t('distillBindingOther')}《${boundAuthor.name}》` : t('distillNotBound')}</span>
              <span className="qibi-spacer" />
              {isBound ? (
                <>
                  <span className="qibi-tag">{t('distillBound')}</span>
                  <button type="button" className="qibi-btn small" disabled={!writable || busy} onClick={() => void bindAuthor(null)}>{t('distillUnbind')}</button>
                </>
              ) : (
                <button
                  type="button"
                  className="qibi-btn small"
                  disabled={!writable || busy || novelId == null || !detail.currentVersion}
                  onClick={() => void bindAuthor(detail.id)}
                >{t('distillBind')}</button>
              )}
            </div>

            <div className="qibi-row">
              <span className="qibi-section-title">{t('distillSources')} ({detail.sources.length})</span>
              <span className="qibi-spacer" />
              <button type="button" className="qibi-btn small" disabled={!writable || busy} onClick={() => fileRef.current?.click()}>{t('distillUpload')}</button>
              <button type="button" className="qibi-btn small" disabled={!writable || busy} onClick={() => setPasteOpen(value => !value)}>{t('distillPaste')}</button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".txt,.md,.html,.htm,.json,.epub"
                style={{ display: 'none' }}
                onChange={event => { void uploadFiles(event.target.files) }}
              />
            </div>
            <div className="qibi-sub">{t('distillFilesHint')}</div>

            {uploading && (
              <div className="qibi-progress">
                <div className="qibi-progress-bar" style={{ width: `${uploading.percent}%` }} />
                <span>{uploading.filename} · {uploading.percent}%</span>
              </div>
            )}

            {pasteOpen && (
              <fieldset className="qibi-form-lock" disabled={busy || !writable}><div className="qibi-form">
                <Field label={t('distillPasteName')}>
                  <input className="qibi-input" value={pasteName} placeholder="材料.txt" onChange={event => setPasteName(event.target.value)} />
                </Field>
                <Field label={t('distillPasteContent')}>
                  <textarea className="qibi-textarea" rows={6} value={pasteText} onChange={event => setPasteText(event.target.value)} />
                </Field>
                <div className="qibi-actions">
                  <button type="button" className="qibi-btn small primary" disabled={busy || !pasteText.trim()} onClick={() => void addPaste()}>{t('distillAdd')}</button>
                  <button type="button" className="qibi-btn small" onClick={() => setPasteOpen(false)}>{t('cancel')}</button>
                </div>
              </div></fieldset>
            )}

            {detail.sources.length === 0 && <div className="qibi-sub">{t('distillNoSources')}</div>}
            {detail.sources.map(source => (
              <div className="qibi-card" key={source.id}>
                <div className="qibi-row">
                  <strong>{source.filename}</strong>
                  <span className="qibi-tag">{source.format}</span>
                  <span className={`qibi-tag${source.status === 'error' ? ' danger' : ''}`}>{source.status}</span>
                  <span className="qibi-spacer" />
                  <span className="qibi-sub">{formatWords(source.parsedChars)} {t('words')} · {source.chapterCount} {t('chapters')}</span>
                  <button type="button" className="qibi-btn small danger" disabled={!writable || busy} onClick={() => void deleteSource(source)}>{t('delete')}</button>
                </div>
                {source.error && <p className="qibi-error-text">{source.error}</p>}
              </div>
            ))}

            <div className="qibi-section-title">{t('distillAction')}</div>
            <div className="qibi-card">
              <p>{t('distillAgentHint')}</p>
              <div className="qibi-actions">
                <button
                  type="button"
                  className="qibi-btn small primary"
                  disabled={!detail.sources.some(source => source.status === 'ready')}
                  onClick={() => void copyInstruction()}
                >{t('distillInstruction')}</button>
              </div>
            </div>

            {instruction && <section className="qibi-card qibi-distill-instruction" aria-label={t('distillInstructionPreview')}>
              <strong>{t(instructionCopied ? 'distillPasteIntoChat' : 'distillCopyManual')}</strong>
              <p>{t('distillAfterChatHint')}</p>
              <label className="qibi-field"><span className="qibi-label">{t('distillInstructionPreview')}</span><textarea className="qibi-textarea mono" rows={7} readOnly value={instruction} onFocus={event => event.target.select()} /></label>
              <button type="button" className="qibi-btn small" disabled={busy} onClick={() => { void loadDetail(authorId); void loadAuthors(); void loadBinding() }}>{t('distillRefreshAfterChat')}</button>
            </section>}

            <div className="qibi-section-title">{t('distillVersions')} ({detail.versions.length})</div>
            {detail.versions.length === 0 && <div className="qibi-sub">{t('distillNoVersions')}</div>}
            {detail.versions.map(version => (
              <div className="qibi-card" key={version.id}>
                <div className="qibi-row">
                  <strong>v{version.version}</strong>
                  <span className="qibi-sub">{version.createdAt}</span>
                  <span className="qibi-spacer" />
                  <button type="button" className="qibi-btn small" onClick={() => setPreview(version)}>{t('distillView')}</button>
                  <button
                    type="button"
                    className="qibi-btn small"
                    disabled={!writable || busy || detail.currentVersionId === version.id}
                    onClick={() => void rollback(version)}
                  >{t('distillRollback')}</button>
                </div>
                <p>{version.sampleSummary || '—'}</p>
              </div>
            ))}

            {preview && (
              <div className="qibi-card">
                <div className="qibi-row">
                  <strong>v{preview.version}</strong>
                  <span className="qibi-sub">{preview.createdAt}</span>
                  <span className="qibi-spacer" />
                  <button type="button" className="qibi-btn small" onClick={() => setPreview(null)}>×</button>
                </div>
                <pre className="qibi-pre">{preview.skillMarkdown}</pre>
                <details>
                  <summary>{t('distillWritingSkill')}</summary>
                  <pre className="qibi-pre">{preview.writingSkill}</pre>
                </details>
                <details>
                  <summary>{t('distillAuthorPersona')}</summary>
                  <pre className="qibi-pre">{preview.authorPersona}</pre>
                </details>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/** 连续性：分卷 / 章节摘要 / 写作状态。 */
function ContinuityTab({ call, novelId, chapterId, writable, active, notify, t, chapter, chapterDirty = false, organizer }) {
  const refreshVersion = organizer?.refreshVersion ?? 0
  const summaryEdited = useRef(false)
  const writerEdited = useRef(false)
  const summaryVersion = useRef(0)
  const writerVersion = useRef(0)
  const [volumes, setVolumes] = useState(null)
  const [volumeError, setVolumeError] = useState('')
  const [volumeForm, setVolumeForm] = useState(null)
  const [summary, setSummary] = useState(null)
  const [summaryForm, setSummaryForm] = useState({ summary: '', keyEvents: '', cliffhanger: '' })
  const [writerState, setWriterState] = useState(null)
  const [writerForm, setWriterForm] = useState({ progress: '', foreshadowing: '[]' })
  const [busy, setBusy] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingWriter, setLoadingWriter] = useState(false)
  const [summaryError, setSummaryError] = useState('')
  const [writerError, setWriterError] = useState('')
  const summarySeq = useRef(0)
  const writerSeq = useRef(0)
  const volumeSeq = useRef(0)
  const scopeRef = useRef({ novelId, chapterId })
  scopeRef.current = { novelId, chapterId }
  const loadedSummaryFor = useRef(undefined)
  const loadedWriterFor = useRef(undefined)

  const loadVolumes = useCallback(async () => {
    if (novelId === null) return
    const seq = ++volumeSeq.current
    setVolumeError('')
    try {
      const result = await call('volumes', { novelId })
      if (seq !== volumeSeq.current || scopeRef.current.novelId !== novelId) return
      setVolumes(result.volumes)
    } catch (cause) {
      if (seq === volumeSeq.current && scopeRef.current.novelId === novelId) setVolumeError(causeText(cause))
    }
  }, [call, novelId])

  const loadSummary = useCallback(async ({ preserve = false } = {}) => {
    if (scopeRef.current.chapterId !== chapterId || scopeRef.current.novelId !== novelId || (preserve && summaryEdited.current)) return
    if (chapterId === null) {
      loadedSummaryFor.current = null
      setSummary(null)
      setSummaryForm({ summary: '', keyEvents: '', cliffhanger: '' })
      return
    }
    const target = chapterId
    const seq = ++summarySeq.current
    setLoadingSummary(true)
    setSummaryError('')
    try {
      const result = await call('chapterSummary', { chapterId: target })
      // A background refresh cannot replace a draft or its optimistic lock.
      if (seq !== summarySeq.current || scopeRef.current.chapterId !== target || scopeRef.current.novelId !== novelId || (preserve && summaryEdited.current)) return
      summaryEdited.current = false
      summaryVersion.current = refreshVersion
      loadedSummaryFor.current = target
      setSummary(result.summary)
      setSummaryForm({
        summary: result.summary.summary ?? '',
        keyEvents: result.summary.keyEvents ?? '',
        cliffhanger: result.summary.cliffhanger ?? '',
      })
    } catch (cause) {
      if (seq === summarySeq.current) setSummaryError(causeText(cause))
    } finally {
      if (seq === summarySeq.current) setLoadingSummary(false)
    }
  }, [call, novelId, chapterId, refreshVersion])

  const loadWriter = useCallback(async ({ preserve = false } = {}) => {
    if (scopeRef.current.novelId !== novelId || novelId === null || (preserve && writerEdited.current)) return
    const seq = ++writerSeq.current
    setLoadingWriter(true)
    setWriterError('')
    try {
      const result = await call('writerState', { novelId })
      if (seq !== writerSeq.current || scopeRef.current.novelId !== novelId || (preserve && writerEdited.current)) return
      writerEdited.current = false
      writerVersion.current = refreshVersion
      loadedWriterFor.current = novelId
      setWriterState(result.writerState)
      setWriterForm({
        progress: result.writerState.progress ?? '',
        foreshadowing: result.writerState.foreshadowing ?? '[]',
      })
    } catch (cause) {
      if (seq === writerSeq.current) setWriterError(causeText(cause))
    } finally {
      if (seq === writerSeq.current) setLoadingWriter(false)
    }
  }, [call, novelId, refreshVersion])

  useEffect(() => {
    volumeSeq.current += 1
    summarySeq.current += 1
    writerSeq.current += 1
    loadedSummaryFor.current = undefined
    loadedWriterFor.current = undefined
    summaryEdited.current = false
    writerEdited.current = false
    summaryVersion.current = 0
    writerVersion.current = 0
    setVolumes(null)
    setVolumeForm(null)
    setSummary(null)
    setSummaryForm({ summary: '', keyEvents: '', cliffhanger: '' })
    setWriterState(null)
    setWriterForm({ progress: '', foreshadowing: '[]' })
    setLoadingSummary(false)
    setLoadingWriter(false)
    setSummaryError('')
    setWriterError('')
  }, [novelId])

  useEffect(() => {
    summarySeq.current += 1
    summaryEdited.current = false
    summaryVersion.current = 0
    loadedSummaryFor.current = undefined
    setSummary(null)
    setSummaryForm({ summary: '', keyEvents: '', cliffhanger: '' })
    setLoadingSummary(false)
  }, [chapterId])

  useEffect(() => {
    if (active) void loadVolumes()
  }, [active, loadVolumes])

  useEffect(() => {
    if (active && (loadedSummaryFor.current !== chapterId || summaryVersion.current !== refreshVersion)) void loadSummary({ preserve: true })
  }, [active, chapterId, refreshVersion, loadSummary])

  useEffect(() => {
    if (active && (loadedWriterFor.current !== novelId || writerVersion.current !== refreshVersion)) void loadWriter({ preserve: true })
  }, [active, novelId, refreshVersion, loadWriter])

  const startVolume = row => setVolumeForm(row
    ? { id: row.id, token: row.token ?? null, title: row.title, summary: row.summary, coreConflict: row.coreConflict }
    : { id: null, token: null, title: '', summary: '', coreConflict: '' })

  const submitVolume = async () => {
    if (!writable || !volumeForm || busy) return
    if (!volumeForm.title.trim()) {
      notify('error', t('titleRequired'))
      return
    }
    setBusy(true)
    try {
      const payload = { novelId, title: volumeForm.title, summary: volumeForm.summary, coreConflict: volumeForm.coreConflict }
      if (volumeForm.id === null) await call('createVolume', payload)
      else await call('updateVolume', { volumeId: volumeForm.id, ...payload, expectedToken: volumeForm.token ?? undefined })
      await loadVolumes()
      setVolumeForm(null)
      notify('info', t('savedNotice'))
    } catch (cause) {
      if (cause?.code === 'ENTITY_CONFLICT') {
        notify('error', t('entityConflict'))
        // Preserve the conflicted local volume draft.
      } else {
        notify('error', causeText(cause))
      }
    } finally {
      setBusy(false)
    }
  }

  const submitSummary = async () => {
    if (!writable || busy || loadingSummary || summaryError || chapterId === null || loadedSummaryFor.current !== chapterId) return
    setBusy(true)
    try {
      await call('updateChapterSummary', { chapterId, ...summaryForm, expectedToken: summary?.token ?? undefined, expectedAbsent: summary?.exists === false })
      await loadSummary()
      notify('info', t('savedNotice'))
    } catch (cause) {
      if (cause?.code === 'ENTITY_CONFLICT') {
        notify('error', t('entityConflict'))
        // Preserve the conflicted local chapter summary.
      } else {
        notify('error', causeText(cause))
      }
    } finally {
      setBusy(false)
    }
  }

  const submitWriter = async () => {
    if (!writable || busy || loadingWriter || writerError || loadedWriterFor.current !== novelId) return
    try {
      JSON.parse(writerForm.foreshadowing)
    } catch {
      notify('error', t('foreshadowingInvalid'))
      return
    }
    setBusy(true)
    try {
      await call('updateWriterState', { novelId, ...writerForm, expectedToken: writerState?.token ?? undefined, expectedAbsent: writerState?.exists === false })
      await loadWriter()
      notify('info', t('savedNotice'))
    } catch (cause) {
      if (cause?.code === 'ENTITY_CONFLICT') {
        notify('error', t('entityConflict'))
        // Preserve the conflicted local writer-state draft.
      } else {
        notify('error', causeText(cause))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="qibi-pane qibi-continuity-pane">
      {organizer && <ContinuityOrganizer
        chapter={chapter} writable={writable} enabled={organizer.enabled}
        canOrganize={Boolean(chapter?.content?.trim()) && !chapterDirty && !busy && !summaryEdited.current && !writerEdited.current && !loadingSummary && !loadingWriter && !summaryError && !writerError}
        unavailableKey={chapterDirty ? 'continuityOrganizerSaveProse' : busy || loadingSummary || loadingWriter ? 'continuityOrganizerLoading' : summaryError || writerError ? 'continuityOrganizerLoadError' : summaryEdited.current || writerEdited.current ? 'continuityOrganizerSaveNotes' : undefined}
        onToggle={organizer.setAuto} onOrganize={organizer.organize} onCancel={organizer.cancel}
        task={organizer.task} hasSummary={Boolean(summary?.summary?.trim())} t={t}
      />}
      <div className="qibi-section-title">{t('chapterSummary')}</div>
      {summaryError && <div className="qibi-error-text" role="alert">{t('continuityReadFailed')} {summaryError} <button type="button" className="qibi-btn small" disabled={busy || loadingSummary} onClick={() => void loadSummary()}>{t('retry')}</button></div>}
      {chapterId === null
        ? <div className="qibi-sub">{t('noChapterHint')}</div>
        : (
          <fieldset className="qibi-form-lock" disabled={busy || !writable || loadingSummary || Boolean(summaryError) || loadedSummaryFor.current !== chapterId}><div className="qibi-form">
            <Field label={t('summaryText')}>
              <textarea className="qibi-textarea" rows={3} value={summaryForm.summary} onChange={event => { if (!writable || busy) return; summaryEdited.current = true; setSummaryForm(current => ({ ...current, summary: event.target.value })) }} />
            </Field>
            <Field label={t('keyEvents')}>
              <textarea className="qibi-textarea" rows={2} value={summaryForm.keyEvents} onChange={event => { if (!writable || busy) return; summaryEdited.current = true; setSummaryForm(current => ({ ...current, keyEvents: event.target.value })) }} />
            </Field>
            <Field label={t('cliffhanger')}>
              <textarea className="qibi-textarea" rows={2} value={summaryForm.cliffhanger} onChange={event => { if (!writable || busy) return; summaryEdited.current = true; setSummaryForm(current => ({ ...current, cliffhanger: event.target.value })) }} />
            </Field>
            <div className="qibi-actions">
              <button type="button" className="qibi-btn small primary" disabled={!writable || busy || loadingSummary || Boolean(summaryError) || loadedSummaryFor.current !== chapterId} onClick={() => void submitSummary()}>{t('save')}</button>
              <button type="button" className="qibi-btn small" disabled={busy || loadingSummary} onClick={() => { if (window.confirm(t('discardInfoDraftConfirm'))) void loadSummary() }}>{t('reload')}</button>
              {summary?.exists && <span className="qibi-sub">{t('updatedAt')} {summary.updatedAt}</span>}
            </div>
          </div></fieldset>
        )}

      <div className="qibi-section-title">{t('writerState')}</div>
      {writerError && <div className="qibi-error-text" role="alert">{t('continuityReadFailed')} {writerError} <button type="button" className="qibi-btn small" disabled={busy || loadingWriter} onClick={() => void loadWriter()}>{t('retry')}</button></div>}
      <fieldset className="qibi-form-lock" disabled={busy || loadingWriter || Boolean(writerError) || loadedWriterFor.current !== novelId}><div className="qibi-form">
        <Field label={t('progress')}>
          <textarea className="qibi-textarea" rows={3} readOnly={!writable} value={writerForm.progress} onChange={event => { if (!writable || busy) return; writerEdited.current = true; setWriterForm(current => ({ ...current, progress: event.target.value })) }} />
        </Field>
        <div className="qibi-field">
          <span className="qibi-label">{t('foreshadowing')}</span>
          <ForeshadowEditor value={writerForm.foreshadowing} onChange={value => { if (!writable || busy) return; writerEdited.current = true; setWriterForm(current => ({ ...current, foreshadowing: value })) }} disabled={!writable || busy || loadingWriter || Boolean(writerError) || loadedWriterFor.current !== novelId} t={t} />
        </div>
        <div className="qibi-actions">
          <button type="button" className="qibi-btn small primary" disabled={!writable || busy || loadingWriter || Boolean(writerError) || loadedWriterFor.current !== novelId} onClick={() => void submitWriter()}>{t('save')}</button>
          <button type="button" className="qibi-btn small" disabled={busy || loadingWriter} onClick={() => { if (window.confirm(t('discardInfoDraftConfirm'))) void loadWriter() }}>{t('reload')}</button>
          {writerState?.exists && <span className="qibi-sub">{t('updatedAt')} {writerState.updatedAt}</span>}
        </div>
      </div></fieldset>
      <hr className="qibi-continuity-divider" />
      <div className="qibi-row">
        <span className="qibi-section-title">{t('volumes')}</span>
        <span className="qibi-sub">{t('continuityVolumesOptional')}</span>
        <span className="qibi-spacer" />
        <button type="button" className="qibi-btn small" disabled={!writable || busy} onClick={() => startVolume(null)}>＋ {t('volumeNew')}</button>
      </div>
      {volumeError && <div className="qibi-error-text" role="alert">{volumeError} <button type="button" className="qibi-btn small" onClick={() => void loadVolumes()}>{t('retry')}</button></div>}
      {!volumeError && volumes === null && <div className="qibi-sub">{t('loading')}</div>}
      {volumes !== null && volumes.length === 0 && <div className="qibi-sub">{t('emptyVolumes')}</div>}
      {(volumes ?? []).map(row => (
        <div className="qibi-card" key={row.id}>
          <div className="qibi-row">
            <h4>{row.title}</h4>
            <span className="qibi-spacer" />
            <button type="button" className="qibi-btn small" disabled={!writable || busy} onClick={() => startVolume(row)}>{t('edit')}</button>
          </div>
          {row.summary && <p>{row.summary}</p>}
          {row.coreConflict && <p>{t('volumeConflict')}：{row.coreConflict}</p>}
        </div>
      ))}

      {volumeForm && (
        <fieldset className="qibi-form-lock" disabled={busy || !writable}><div className="qibi-form">
          <Field label={t('volumeTitle')}>
            <input className="qibi-input" value={volumeForm.title} onChange={event => setVolumeForm(current => ({ ...current, title: event.target.value }))} />
          </Field>
          <Field label={t('volumeSummary')}>
            <textarea className="qibi-textarea" rows={3} value={volumeForm.summary} onChange={event => setVolumeForm(current => ({ ...current, summary: event.target.value }))} />
          </Field>
          <Field label={t('volumeConflict')}>
            <input className="qibi-input" value={volumeForm.coreConflict} onChange={event => setVolumeForm(current => ({ ...current, coreConflict: event.target.value }))} />
          </Field>
          <div className="qibi-actions">
            <button type="button" className="qibi-btn small primary" disabled={busy} onClick={() => void submitVolume()}>{t('save')}</button>
            <button type="button" className="qibi-btn small" onClick={() => setVolumeForm(null)}>{t('cancel')}</button>
          </div>
        </div></fieldset>
      )}

    </div>
  )
}

/** 检索：关键词 + 起笔 BM25 知识库。 */
function SearchTab({ call, novelId, writable, active, notify, onOpenChapter, t }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [hits, setHits] = useState(null)
  const [stats, setStats] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setResult(null)
    setHits(null)
    setStats(null)
  }, [novelId])

  const loadStats = useCallback(async () => {
    if (novelId === null) return
    try {
      setStats(await call('kbStats', { novelId }))
    } catch (cause) {
      notify('error', causeText(cause))
    }
  }, [call, novelId, notify])

  useEffect(() => {
    if (active) void loadStats()
  }, [active, loadStats])

  const run = async () => {
    const text = query.trim()
    if (!text || novelId === null || busy) return
    setBusy(true)
    try {
      const [keyword, kb] = await Promise.all([
        call('search', { query: text, novelId }),
        call('kbQuery', { novelId, query: text, limit: 10 }),
      ])
      setResult(keyword)
      setHits(kb.hits)
    } catch (cause) {
      notify('error', causeText(cause))
    } finally {
      setBusy(false)
    }
  }

  const reindex = async () => {
    if (!window.confirm(t('confirmReindex'))) return
    try {
      setStats(await call('reindexNovel', { novelId }))
      notify('info', t('reindexedNotice'))
    } catch (cause) {
      notify('error', causeText(cause))
    }
  }

  return (
    <div className="qibi-pane">
      <div className="qibi-row">
        <input
          className="qibi-input"
          value={query}
          placeholder={t('searchPlaceholder')}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter') void run() }}
        />
        <button type="button" className="qibi-btn small primary" disabled={busy || !query.trim()} onClick={() => void run()}>{t('search')}</button>
      </div>
      <div className="qibi-row">
        <span className="qibi-sub">{stats ? `${t('kbStatsLabel')} ${stats.chunks}` : ''}{stats?.lastIndexed ? ` · ${t('updatedAt')} ${stats.lastIndexed}` : ''}</span>
        <span className="qibi-spacer" />
        <button type="button" className="qibi-btn small" disabled={!writable || busy} onClick={() => void reindex()}>{t('reindex')}</button>
      </div>

      {result && (
        <>
          <div className="qibi-section-title">{t('searchKeyword')}</div>
          {result.chapters.length === 0 && result.characters.length === 0 && <div className="qibi-sub">{t('searchEmpty')}</div>}
          {result.chapters.map(hit => (
            <button type="button" className="qibi-result" key={`c${hit.id}`} onClick={() => onOpenChapter(hit.novelId, hit.id)}>
              <strong>{hit.title}</strong>
              <span className="qibi-sub">{formatWords(hit.wordCount)} {t('words')}</span>
              <span className="qibi-snippet">{hit.snippet}</span>
            </button>
          ))}
          {result.characters.map(hit => (
            <div className="qibi-result" key={`p${hit.id}`}>
              <strong>{hit.name}{hit.role ? ` · ${hit.role}` : ''}</strong>
              <span className="qibi-snippet">{hit.background}</span>
            </div>
          ))}
        </>
      )}

      {hits && (
        <>
          <div className="qibi-section-title">{t('searchKb')}</div>
          {hits.length === 0 && <div className="qibi-sub">{t('searchEmpty')}</div>}
          {hits.map((hit, index) => {
            const openable = hit.kind === 'chapter' && hit.sourceId !== null
            return (
              <button
                type="button"
                className="qibi-result"
                key={`k${index}`}
                style={openable ? undefined : { cursor: 'default' }}
                onClick={openable ? () => onOpenChapter(novelId, hit.sourceId) : undefined}
              >
                <strong>{hit.title}</strong>
                <span className="qibi-sub">{hit.score}</span>
                <span className="qibi-snippet">{hit.content}</span>
              </button>
            )
          })}
        </>
      )}
    </div>
  )
}

/** 版本历史：列表 + 恢复。 */
function RevisionsTab({ call, chapterId, writable, active, notify, onRestored, guard, t }) {
  const [revisions, setRevisions] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (chapterId === null) {
      setRevisions(null)
      return
    }
    try {
      const result = await call('revisions', { chapterId })
      setRevisions(result.revisions)
      setError(null)
    } catch (cause) {
      setError(causeText(cause))
    }
  }, [call, chapterId])

  useEffect(() => {
    setError(null)
  }, [chapterId])

  useEffect(() => {
    if (active) void load()
  }, [active, load])

  const restore = async row => {
    // 恢复会覆盖正文：先把未保存草稿落盘，否则它会被磁盘上的旧版本顶掉且无处找回。
    if (guard) {
      const ok = await guard()
      if (!ok) return
    }
    if (!window.confirm(t('confirmRestore'))) return
    setBusy(true)
    try {
      const result = await call('restoreRevision', { chapterId, revisionId: row.id })
      notify('info', t('restoredNotice'))
      await load()
      if (onRestored) await onRestored(result.chapter)
    } catch (cause) {
      notify('error', causeText(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="qibi-pane">
      <div className="qibi-row">
        <span className="qibi-section-title">{t('tabRevisions')}</span>
        <span className="qibi-spacer" />
        <button type="button" className="qibi-btn small" onClick={() => void load()}>{t('refresh')}</button>
      </div>
      {chapterId === null && <div className="qibi-sub">{t('noChapterHint')}</div>}
      {chapterId !== null && error && <LoadError message={error} onRetry={() => void load()} t={t} />}
      {chapterId !== null && !error && revisions === null && <div className="qibi-sub">{t('loading')}</div>}
      {!error && revisions !== null && revisions.length === 0 && (
        <div className="qibi-empty">
          <strong>{t('revisionsEmpty')}</strong>
          <span>{t('revisionsEmptyHint')}</span>
        </div>
      )}
      {!error && (revisions ?? []).map(row => (
        <div className="qibi-card" key={row.id}>
          <div className="qibi-row">
            <h4>#{row.id} · {row.title || t('untitled')}</h4>
            <span className="qibi-sub">{row.createdAt}</span>
            <span className="qibi-spacer" />
            <span className="qibi-sub">{formatWords(row.wordCount)} {t('words')}</span>
            <button type="button" className="qibi-btn small" disabled={!writable || busy} onClick={() => void restore(row)}>{t('restore')}</button>
          </div>
          <p>{row.reason || '—'}</p>
        </div>
      ))}
    </div>
  )
}

/** 导出：生成预览、下载或复制。 */
function ExportTab({ call, novelId, notify, t }) {
  const [format, setFormat] = useState('markdown')
  const [onlyPublished, setOnlyPublished] = useState(false)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setResult(null)
  }, [novelId])

  const generate = async () => {
    if (novelId === null || busy) return
    setBusy(true)
    try {
      setResult(await call('export', { novelId, format, onlyPublished }))
    } catch (cause) {
      notify('error', causeText(cause))
    } finally {
      setBusy(false)
    }
  }

  const download = () => {
    if (!result) return
    const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = result.filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const copy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.content)
      notify('info', t('exportCopied'))
    } catch (cause) {
      notify('error', causeText(cause))
    }
  }

  return (
    <div className="qibi-pane">
      <div className="qibi-row">
        <Field label={t('exportFormat')}>
          <select className="qibi-select" value={format} onChange={event => setFormat(event.target.value)}>
            <option value="markdown">Markdown</option>
            <option value="txt">TXT</option>
          </select>
        </Field>
        <label className="qibi-check">
          <input type="checkbox" checked={onlyPublished} onChange={event => setOnlyPublished(event.target.checked)} />
          {t('exportOnlyPublished')}
        </label>
        <span className="qibi-spacer" />
        <button type="button" className="qibi-btn small primary" disabled={busy || novelId === null} onClick={() => void generate()}>{t('exportGenerate')}</button>
      </div>

      {result && (
        <>
          <div className="qibi-row">
            <span className="qibi-sub">{result.filename} · {result.chapters} {t('chapters')} · {formatWords(result.wordCount)} {t('words')}</span>
            <span className="qibi-spacer" />
            <button type="button" className="qibi-btn small" onClick={() => void copy()}>{t('exportCopy')}</button>
            <button type="button" className="qibi-btn small primary" onClick={download}>{t('exportDownload')}</button>
          </div>
          <textarea className="qibi-textarea preview mono" readOnly value={result.content} />
        </>
      )}
    </div>
  )
}


/** Only submit an author ID that was listed for the exact selected database. */
export function dataSettingsPayload({ dataDir, mode, userId }, info) {
  const target = String(dataDir ?? '').trim()
  const payload = { dataDir: target, mode }
  const sameDirectory = target === String(info?.dataDir ?? '').trim()
  const id = Number(userId)
  if (mode === 'existing' && sameDirectory && Array.isArray(info?.users)
    && info.users.some(row => row.id === id && !row.disabled)) payload.userId = id
  return payload
}

/** 数据位置：读取/切换起笔数据目录，不直接搬移或覆盖旧书稿。 */
function DataSettings({ call, t, initialSettings, onBeforeSave, onSaved, onCancel, onBusyChange }) {
  const [info, setInfo] = useState(() => initialSettings ?? null)
  const [dataDir, setDataDir] = useState(() => initialSettings?.dataDir || initialSettings?.defaultDataDir || '')
  const [mode, setMode] = useState(() => initialSettings?.exists === true ? 'existing' : 'create')
  const [userId, setUserId] = useState(() => initialSettings?.userId == null ? '' : String(initialSettings.userId))
  const [loading, setLoading] = useState(() => !initialSettings)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await call('dataSettings', {})
      setInfo(result)
      setDataDir(previous => previous || result?.dataDir || result?.defaultDataDir || '')
      if (typeof result?.exists === 'boolean') setMode(result.exists ? 'existing' : 'create')
      setUserId(previous => previous || (result?.userId == null ? '' : String(result.userId)))
    } catch (cause) {
      setError(causeText(cause))
    } finally {
      setLoading(false)
    }
  }, [call])

  useEffect(() => { if (!initialSettings) void load() }, [initialSettings, load])

  const pick = async () => {
    if (!info?.canPick || busy) return
    setError('')
    try {
      const result = await call('pickDataDir', {})
      if (result?.path) {
        setDataDir(result.path)
        setUserId('')
      }
    } catch (cause) {
      setError(causeText(cause))
    }
  }

  const save = async () => {
    if (busy || !info?.canSave || !dataDir.trim()) return
    setBusy(true)
    onBusyChange?.(true)
    setError('')
    try {
      if (onBeforeSave && !(await onBeforeSave())) return
      const payload = dataSettingsPayload({ dataDir, mode, userId }, info)
      const result = await call('saveDataSettings', payload)
      if (onSaved) await onSaved(result)
    } catch (cause) {
      setError(causeText(cause))
    } finally {
      setBusy(false)
      onBusyChange?.(false)
    }
  }

  const users = Array.isArray(info?.users) ? info.users : []
  const sameDirectory = Boolean(info?.dataDir) && dataDir.trim() === String(info.dataDir).trim()
  const availableUsers = sameDirectory ? users : []
  const currentPath = info?.dbPath || info?.dataDir || ''
  const cannotSaveReason = info?.canSaveReason || info?.reason || info?.error || t('dataSettingsCannotSave')

  return (
    <div className="qibi-form qibi-data-settings">
      {loading && <div className="qibi-sub">{t('loading')}</div>}
      {!loading && (
        <>
          <div className="qibi-field">
            <label className="qibi-label" htmlFor="qibi-data-directory">{t('dataSettingsDirectory')}</label>
            <div className="qibi-row">
              <input
                id="qibi-data-directory"
                className="qibi-input"
                value={dataDir}
                onChange={event => {
                  setDataDir(event.target.value)
                  setUserId('')
                }}
                placeholder={info?.defaultDataDir || ''}
                disabled={busy}
              />
              {info?.canPick && (
                <button type="button" className="qibi-btn small" disabled={busy} onClick={() => void pick()}>{t('dataSettingsBrowse')}</button>
              )}
            </div>
          </div>

          <div className="qibi-field">
            <span className="qibi-label">{t('dataSettingsMode')}</span>
            <label className="qibi-check">
              <input type="radio" name="qibi-data-mode" value="create" checked={mode === 'create'} disabled={busy} onChange={() => setMode('create')} />
              {t('dataSettingsCreate')}
            </label>
            {mode === 'create' && <span className="qibi-sub">{t('dataSettingsModeHintCreate')}</span>}
            <label className="qibi-check">
              <input type="radio" name="qibi-data-mode" value="existing" checked={mode === 'existing'} disabled={busy} onChange={() => setMode('existing')} />
              {t('dataSettingsExisting')}
            </label>
            {mode === 'existing' && <span className="qibi-sub">{t('dataSettingsModeHintExisting')}</span>}
          </div>

          {mode === 'existing' && availableUsers.length > 0 && (
            <Field label={t('dataSettingsUser')}>
              <select className="qibi-select" value={userId} disabled={busy} onChange={event => setUserId(event.target.value)}>
                <option value="">{t('dataSettingsUserDefault')}</option>
                {availableUsers.map(user => <option key={user.id} value={String(user.id)}>{user.username || user.name || `#${user.id}`}</option>)}
              </select>
            </Field>
          )}

          <div className="qibi-card qibi-data-settings-current">
            <strong>{t('dataSettingsCurrent')}</strong>
            <span>{currentPath || t('dataSettingsNoCurrent')}</span>
            <span className="qibi-sub">{t('dataSettingsNoMove')}</span>
          </div>

          {info?.canSave === false && <div className="qibi-error-text">{cannotSaveReason}</div>}
          {error && (
            <div className="qibi-error-text">
              {error}
              <button type="button" className="qibi-btn small" disabled={busy} onClick={() => void load()}>{t('retry')}</button>
            </div>
          )}

          <div className="qibi-actions">
            {onCancel && <button type="button" className="qibi-btn small" disabled={busy} onClick={onCancel}>{t('cancel')}</button>}
            <span className="qibi-spacer" />
            <button type="button" className="qibi-btn small primary" disabled={busy || loading || info?.canSave !== true || !dataDir.trim()} onClick={() => void save()}>
              {busy ? t('saving') : t('dataSettingsSave')}
            </button>
          </div>
        </>
      )}
      {!loading && !info && !error && <div className="qibi-error-text">{t('dataSettingsLoadFailed')}</div>}
    </div>
  )
}

function ThemedWorkbench(props) {
  return <AppearanceFrame t={props.t}>{appearance => <Workbench {...props} appearance={appearance} />}</AppearanceFrame>
}

/** 主面板组件。主题只改变父级样式，编辑与数据状态不被重新初始化。 */
function Workbench({ call, t, appearance }) {
  const [status, setStatus] = useState(null)
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState(null)
  const [loadEpoch, setLoadEpoch] = useState(0)
  const [dataSettingsOpen, setDataSettingsOpen] = useState(false)
  const [dataSettingsBusy, setDataSettingsBusy] = useState(false)

  const [novels, setNovels] = useState([])
  const [novelId, setNovelId] = useState(null)
  const [chapters, setChapters] = useState([])
  const [chapterId, setChapterId] = useState(null)

  const [chapter, setChapter] = useState(null)
  const [draft, setDraft] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState('idle')
  const [conflict, setConflict] = useState(null)
  const [characters, setCharacters] = useState([])
  const [cast, setCast] = useState([])

  const [tab, setTab] = useState('body')
  const [writable, setWritable] = useState(false)
  const [creating, setCreating] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const transitionRef = useRef(false)
  const [newTitle, setNewTitle] = useState('')
  const [notice, setNotice] = useState(null)
  const [novelDialog, setNovelDialog] = useState(null)
  const novelRequestRef = useRef(false)
  const outlineGuardRef = useRef(null)
  const registerOutlineGuard = useCallback(guard => {
    outlineGuardRef.current = guard
    return () => { if (outlineGuardRef.current === guard) outlineGuardRef.current = null }
  }, [])
  const novelFormId = useId()
  const [chapterDialog, setChapterDialog] = useState(null)
  const [aiInfo, setAiInfo] = useState(null)
  const [aiInfoLoading, setAiInfoLoading] = useState(false)
  const aiInfoSequence = useRef(0)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiSelection, setAiSelection] = useState(null)
  const [aiInitialMode, setAiInitialMode] = useState(null)
  const [findOpen, setFindOpen] = useState(false)
  const [findQuery, setFindQuery] = useState('')
  const [findReplace, setFindReplace] = useState('')
  const [findIndex, setFindIndex] = useState(0)
  const [contextMenu, setContextMenu] = useState(null)
  const [novelQuery, setNovelQuery] = useState('')
  const [chapterQuery, setChapterQuery] = useState('')
  const [chapterMenu, setChapterMenu] = useState(false)
  const [zen, setZen] = useState(() => readFlag('qibi:zen'))
  const [outlines, setOutlines] = useState([])
  const [outlineMarkers, setOutlineMarkers] = useState(() => readJson('qibi:outline-markers', {}))
  const [markerEditing, setMarkerEditing] = useState(null)
  const editorRef = useRef(null)

  const dirtyRef = useRef(false)
  const chapterRef = useRef(null)
  const draftRef = useRef('')
  const revRef = useRef(0)
  const chapterIdRef = useRef(null)
  const saveInFlightRef = useRef(null)
  // 撤销/重做：受控 textarea 的原生 undo 会被 React 的值同步打断，
  // AI 写入、一键排版、查找替换这类程序化改动也不会进原生栈。
  const historyRef = useRef(createHistory())
  const tabRef = useRef('body')

  useEffect(() => { dirtyRef.current = dirty }, [dirty])
  useEffect(() => { chapterRef.current = chapter }, [chapter])
  useEffect(() => { draftRef.current = draft }, [draft])
  useEffect(() => { chapterIdRef.current = chapterId }, [chapterId])
  useEffect(() => { tabRef.current = tab }, [tab])

  const notify = useCallback((kind, text) => setNotice({ kind, text }), [])
  const continuity = useContinuityJobs({ call, status, novelId, writable, notify, t })
  const chapterSubmitRef = useRef(false)

  const retryStatus = useCallback(() => {
    // Re-query status/novels in this Workbench; never reload the host page/session.
    chapterRef.current = null
    chapterIdRef.current = null
    draftRef.current = ''
    dirtyRef.current = false
    setStatus(null)
    setError(null)
    setNovels([])
    setNovelId(null)
    setChapters([])
    setChapterId(null)
    setChapter(null)
    setDraft('')
    setDirty(false)
    setConflict(null)
    setSaveState('idle')
    setPhase('loading')
    setLoadEpoch(value => value + 1)
  }, [])

  useEffect(() => {
    if (!notice || notice.kind === 'error') return undefined
    const timer = setTimeout(() => setNotice(null), 5000)
    return () => clearTimeout(timer)
  }, [notice])

  useEffect(() => { writeFlag('qibi:zen', zen) }, [zen])

  // Alt+F 专注模式：与起笔一致，隐藏左右栏并放大正文。
  useEffect(() => {
    const onKey = event => {
      if (!event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key !== 'f' && event.key !== 'F') return
      event.preventDefault()
      setZen(value => !value)
      // 专注模式只留正文，避免停在大纲/人物页签时看不到内容。
      setTab('body')
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  // AI 可用性与模型名：配了模型才显示生成入口。
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const info = await call('aiInfo', {})
        if (!cancelled) setAiInfo(info)
      } catch {
        // 没有可用的模型服务时保持 null，面板显示不可用。
      }
    })()
    return () => { cancelled = true }
  }, [call])

  // 人物名单：用于「本章出场人物」识别，失败时静默（不影响正文）。
  useEffect(() => {
    if (novelId === null) {
      setCharacters([])
      return undefined
    }
    let cancelled = false
    ;(async () => {
      try {
        const result = await call('characters', { novelId })
        if (!cancelled) setCharacters(result.characters ?? [])
      } catch {
        if (!cancelled) setCharacters([])
      }
    })()
    return () => { cancelled = true }
  }, [call, novelId])

  // 按姓名/别名扫描当前章节（防抖，避免每次按键都全章扫描）。
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!draft || characters.length === 0) {
        setCast([])
        return
      }
      const rows = []
      for (const row of characters) {
        const names = [row.name, ...String(row.alias ?? '').split(/[,，、;；\s]+/)]
          .map(name => String(name ?? '').trim())
          .filter(Boolean)
        let count = 0
        for (const name of names) {
          let at = draft.indexOf(name)
          while (at !== -1) {
            count += 1
            at = draft.indexOf(name, at + name.length)
          }
        }
        if (count > 0) rows.push({ id: row.id, name: row.name, alias: row.alias, count })
      }
      rows.sort((a, b) => b.count - a.count)
      setCast(rows.slice(0, 12))
    }, 400)
    return () => clearTimeout(timer)
  }, [draft, characters])

  // 细纲锚点：进入正文页签时刷新大纲（在大纲页签改完回到正文即可见）。
  useEffect(() => {
    if (novelId === null) {
      setOutlines([])
      return undefined
    }
    if (tab !== 'body') return undefined
    let cancelled = false
    ;(async () => {
      try {
        const result = await call('outline', { novelId })
        if (!cancelled) setOutlines(result.outline ?? [])
      } catch {
        if (!cancelled) setOutlines([])
      }
    })()
    return () => { cancelled = true }
  }, [call, novelId, tab])

  useEffect(() => { writeJson('qibi:outline-markers', outlineMarkers) }, [outlineMarkers])

  // 点击任意处关闭右键菜单。
  useEffect(() => {
    if (!contextMenu) return undefined
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('keydown', close)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('keydown', close)
    }
  }, [contextMenu])

  // 点击任意处关闭章节「⋯」菜单。
  useEffect(() => {
    if (!chapterMenu) return undefined
    const close = () => setChapterMenu(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [chapterMenu])

  const adoptChapter = useCallback(next => {
    chapterRef.current = next
    draftRef.current = next.content
    dirtyRef.current = false
    setChapter(next)
    setDraft(next.content)
    setDirty(false)
    setConflict(null)
    setSaveState('idle')
    // 换章或被外部刷新后，旧历史指向别的正文，必须清空。
    historyRef.current = { ...createHistory(), lastText: next.content }
    setChapters(previous => previous.map(row => (row.id === next.id
      ? { ...row, title: next.title, status: next.status, wordCount: next.wordCount, updatedAt: next.updatedAt }
      : row)))
  }, [])

  const refreshNovels = useCallback(async (preferred) => {
    const list = await call('novels', {})
    setNovels(list.novels)
    if (list.novels.length === 0) {
      setNovelId(null)
      setPhase('empty')
      return []
    }
    setNovelId(previous => {
      const wanted = preferred !== undefined ? preferred : previous
      return wanted !== null && list.novels.some(row => row.id === wanted) ? wanted : list.novels[0].id
    })
    setPhase('ready')
    return list.novels
  }, [call])

  const refreshChapters = useCallback(async (targetNovelId, preferred) => {
    const id = targetNovelId !== undefined && targetNovelId !== null ? targetNovelId : novelId
    if (id === null) {
      setChapters([])
      setChapterId(null)
      return []
    }
    const result = await call('chapters', { novelId: id })
    setChapters(result.chapters)
    setChapterId(previous => {
      const wanted = preferred !== undefined ? preferred : previous
      return wanted !== null && result.chapters.some(row => row.id === wanted)
        ? wanted
        : (result.chapters[0]?.id ?? null)
    })
    return result.chapters
  }, [call, novelId])

  useEffect(() => {
    const beforeUnload = event => {
      if (!dirtyRef.current && !saveInFlightRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [])

  // ---- 首屏：状态 + 作品 ----
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const next = await call('status', {})
        if (cancelled) return
        setStatus(next)
        setWritable(next.writable)
        if (!next.exists) { setPhase('nodb'); return }
        if (next.error) { setError(next.error); setPhase('error'); return }
        const list = await call('novels', {})
        if (cancelled) return
        setNovels(list.novels)
        if (list.novels.length === 0) { setPhase('empty'); return }
        setNovelId(previous => previous ?? list.novels[0].id)
        setPhase('ready')
      } catch (cause) {
        if (cancelled) return
        setError({ message: causeText(cause) })
        setPhase('error')
      }
    })()
    return () => { cancelled = true }
  }, [call, loadEpoch])

  // ---- 作品变化：拉章节 ----
  useEffect(() => {
    if (novelId === null) return
    let cancelled = false
    ;(async () => {
      try {
        const result = await call('chapters', { novelId })
        if (cancelled) return
        setChapters(result.chapters)
        setChapterId(previous => (previous !== null && result.chapters.some(row => row.id === previous)
          ? previous
          : (result.chapters[0]?.id ?? null)))
      } catch (cause) {
        if (!cancelled) notify('error', causeText(cause))
      }
    })()
    return () => { cancelled = true }
  }, [call, novelId, notify])

  // ---- 章节变化：拉正文 + 通知宿主选中态 ----
  useEffect(() => {
    if (chapterId === null) {
      chapterRef.current = null
      draftRef.current = ''
      setChapter(null)
      setDraft('')
      setDirty(false)
      return
    }
    // 加载期间不保留上一章的可编辑状态，否则输入可能被写回上一章或被静默丢弃。
    chapterRef.current = null
    draftRef.current = ''
    setChapter(null)
    setDraft('')
    setDirty(false)
    setConflict(null)
    setSaveState('idle')
    let cancelled = false
    ;(async () => {
      try {
        const [loaded] = await Promise.all([
          call('chapter', { chapterId }),
          call('select', { novelId, chapterId }).catch(() => null),
        ])
        if (cancelled) return
        adoptChapter(loaded.chapter)
      } catch (cause) {
        if (!cancelled) notify('error', causeText(cause))
      }
    })()
    return () => { cancelled = true }
  }, [adoptChapter, call, chapterId, novelId, notify])

  // ---- 保存 ----
  const save = useCallback((options = {}) => runSerializedSave(saveInFlightRef, options.force === true, async () => {
    const current = chapterRef.current
    if (!current || !writable) return false
    const content = draftRef.current
    if (options.force !== true && content === current.content) {
      dirtyRef.current = false
      setDirty(false)
      return true
    }
    setSaveState('saving')
    try {
      const result = await call('save', {
        chapterId: current.id, content,
        expectedToken: options.force === true ? undefined : current.token,
      })
      if (chapterIdRef.current === result.chapter.id) {
        chapterRef.current = result.chapter
        setChapter(result.chapter)
        const hasEdits = draftRef.current !== result.chapter.content
        dirtyRef.current = hasEdits
        setDirty(hasEdits)
        setConflict(null)
        setSaveState(hasEdits ? 'idle' : 'saved')
      }
      setChapters(previous => previous.map(row => (row.id === result.chapter.id
        ? { ...row, title: result.chapter.title, status: result.chapter.status, wordCount: result.chapter.wordCount, updatedAt: result.chapter.updatedAt }
        : row)))
      setNovels(previous => previous.map(row => (row.id === current.novelId
        ? { ...row, wordCount: row.wordCount - current.wordCount + result.chapter.wordCount }
        : row)))
      return true
    } catch (cause) {
      if (chapterIdRef.current !== current.id) return false
      if (cause?.code === 'CHAPTER_CONFLICT') {
        setConflict({ currentUpdatedAt: cause.details?.currentUpdatedAt ?? null })
        setSaveState('idle')
      } else {
        setSaveState('error')
        notify('error', causeText(cause))
      }
      return false
    }
  }), [call, notify, writable])

  // ---- 防抖自动保存 ----
  useEffect(() => {
    if (!dirty || conflict || !writable || chapter === null) return undefined
    const timer = setTimeout(() => { void save() }, 900)
    return () => clearTimeout(timer)
  }, [draft, dirty, conflict, writable, chapter, save])

  // ---- 轮询：发现磁盘上的变化（Agent 写入 / 起笔本体） ----
  useEffect(() => {
    let cancelled = false
    let running = false
    const timer = setInterval(async () => {
      if (running) return
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      running = true
      try {
        const pulse = await call('pulse', {})
        if (cancelled) return
        setWritable(pulse.writable)
        if (pulse.rev === revRef.current) return
        revRef.current = pulse.rev
        // 资料页签不会自动覆盖正在编辑的表单，只提示作者切换页签或重开表单即可拿到新数据。
        if (['outline', 'characters', 'continuity'].includes(tabRef.current)) {
          notify('info', t('externalChange'))
        }
        if (novelId === null) return
        const [list, novelList] = await Promise.all([
          call('chapters', { novelId }),
          call('novels', {}),
        ])
        if (cancelled) return
        setChapters(list.chapters)
        setNovels(novelList.novels)
        const target = chapterRef.current?.id ?? chapterId
        if (target && !list.chapters.some(row => row.id === target)) {
          if (dirtyRef.current) { notify('error', t('chapterRemovedDraftKept')); return }
          chapterRef.current = null
          chapterIdRef.current = null
          setChapterId(null)
          setChapter(null)
          setDraft('')
          return
        }
        if (target) {
          const loaded = await call('chapter', { chapterId: target })
          if (cancelled || chapterRef.current?.id !== target) return
          const current = chapterRef.current
          // 只有这一章真的变了才提示；否则改大纲/人物也会触发一次假提醒。
          if (!current || loaded.chapter.token !== current.token) {
            if (!dirtyRef.current) {
              adoptChapter(loaded.chapter)
            } else {
              notify('info', t('externalChange'))
            }
          }
        }
      } catch {
        // 轮询失败不打扰作者，下一次再试。
      } finally {
        running = false
      }
    }, 2500)
    return () => { cancelled = true; clearInterval(timer) }
  }, [adoptChapter, call, chapterId, notify, novelId, t])

  // ---- 交互 ----
  const guardDirty = useCallback(() => {
    const target = chapterIdRef.current
    return flushDraft({
      isCurrent: () => chapterIdRef.current === target,
      isDirty: () => dirtyRef.current,
      isSaving: () => Boolean(saveInFlightRef.current),
      save,
    })
  }, [save])

  const runTransition = useCallback(async action => {
    if (transitionRef.current) return false
    transitionRef.current = true
    setTransitioning(true)
    try {
      if (!(await guardDirty())) return false
      await action()
      return true
    } finally { transitionRef.current = false; setTransitioning(false) }
  }, [guardDirty])

  const beforeDataSettingsSave = useCallback(async () => {
    if (outlineGuardRef.current && !(await outlineGuardRef.current())) return false
    const ok = await guardDirty()
    if (!ok) return false
    if (['characters', 'continuity'].includes(tab)) {
      return window.confirm(t('dataSettingsInfoPageConfirm'))
    }
    return true
  }, [guardDirty, tab, t])

  const finishDataSettingsSave = useCallback(() => {
    setDataSettingsOpen(false)
    retryStatus()
  }, [retryStatus])

  const chooseNovel = useCallback(async id => {
    if (id === novelId) return
    if (outlineGuardRef.current && !(await outlineGuardRef.current())) return
    const ok = await guardDirty()
    if (!ok || transitionRef.current) return
    chapterRef.current = null
    chapterIdRef.current = null
    draftRef.current = ''
    setNovelId(id)
    setChapterId(null)
    setChapter(null)
    setDraft('')
    setDirty(false)
    setCreating(false)
    setNewTitle('')
    setTab('body')
  }, [guardDirty, novelId])

  const chooseChapter = useCallback(async id => {
    if (id === chapterId) return
    const ok = await guardDirty()
    if (!ok || transitionRef.current) return
    // 先把旧章节从可编辑状态里摘掉，加载期间不允许把输入写回上一章。
    chapterRef.current = null
    chapterIdRef.current = id
    draftRef.current = ''
    setChapter(null)
    setDraft('')
    setDirty(false)
    setConflict(null)
    setSaveState('idle')
    setChapterId(id)
  }, [chapterId, guardDirty])

  const reload = useCallback(async (options = {}) => {
    if (chapterId === null || transitionRef.current) return
    transitionRef.current = true
    setTransitioning(true)
    try {
      if (options.force !== true && !(await guardDirty())) return
      setNotice(null)
      const loaded = await call('chapter', { chapterId })
      if (chapterIdRef.current === chapterId) adoptChapter(loaded.chapter)
    } catch (cause) { notify('error', causeText(cause)) }
    finally { transitionRef.current = false; setTransitioning(false) }
  }, [adoptChapter, call, chapterId, guardDirty, notify])

  const toggleWritable = useCallback(async () => {
    if (!writable) {
      try { const result = await call('writable', { writable: true }); setWritable(result.writable) }
      catch (cause) { notify('error', causeText(cause)) }
      return
    }
    // 关闭写入前先把当前草稿落盘，否则 dirty 会在只读状态下把切换章节卡住。
    await runTransition(async () => {
      try {
        const result = await call('writable', { writable: !writable })
        setWritable(result.writable)
      } catch (cause) { notify('error', causeText(cause)) }
    })
  }, [call, notify, runTransition, writable])

  const createChapter = useCallback(async () => {
    const title = newTitle.trim()
    if (!title || novelId === null) return
    await runTransition(async () => {
    try {
      const result = await call('createChapter', { novelId, title })
      setCreating(false)
      setNewTitle('')
      await refreshChapters(novelId, result.chapter.id)
      await refreshNovels(novelId)
      setTab('body')
    } catch (cause) {
      notify('error', causeText(cause))
    }
    })
  }, [runTransition, call, newTitle, novelId, notify, refreshChapters, refreshNovels])

  const moveChapter = useCallback(async direction => {
    const current = chapterRef.current
    if (!current) return
    await runTransition(async () => {
    try {
      await call('moveChapter', { chapterId: current.id, direction })
      await refreshChapters(novelId, current.id)
    } catch (cause) {
      notify('error', causeText(cause))
    }
    })
  }, [runTransition, call, novelId, notify, refreshChapters])

  const openChapterEdit = useCallback(async () => {
    const current = chapterRef.current
    if (!current) return
    const ok = await guardDirty()
    if (!ok) return
    const saved = chapterRef.current
    if (!saved || saved.id !== current.id) return
    setChapterDialog({ chapterId: saved.id, form: { title: saved.title, status: saved.status || '草稿' }, busy: false })
  }, [guardDirty])

  const submitChapter = useCallback(async () => {
    const current = chapterRef.current
    if (!current || !writable || !chapterDialog || chapterDialog.busy || chapterSubmitRef.current || current.id !== chapterDialog.chapterId) return
    if (!chapterDialog.form.title.trim()) { notify('error', t('titleRequired')); return }
    const sourceScope = continuity.scopeKey
    chapterSubmitRef.current = true
    setChapterDialog(previous => previous ? { ...previous, busy: true } : previous)
    try {
      await runTransition(async () => {
        const result = await call('updateChapter', { chapterId: current.id, title: chapterDialog.form.title, status: chapterDialog.form.status })
        if (chapterIdRef.current === result.chapter.id) adoptChapter(result.chapter)
        setChapterDialog(null)
        notify('info', t('savedNotice'))
        if (result.becamePublished) continuity.enqueue(result.chapter, true, sourceScope)
      })
    } catch (cause) { notify('error', causeText(cause)) }
    finally {
      chapterSubmitRef.current = false
      setChapterDialog(previous => previous?.chapterId === current.id ? { ...previous, busy: false } : previous)
    }
  }, [adoptChapter, call, chapterDialog, continuity, notify, runTransition, t, writable])

  const deleteChapter = useCallback(async () => {
    const current = chapterRef.current
    if (!current) return
    const ok = await guardDirty()
    if (!ok) return
    if (!window.confirm(t('confirmDeleteChapter'))) return
    await runTransition(async () => {
    try {
      setChapterDialog(null)
      const result = await call('deleteChapter', { chapterId: current.id, confirm: true })
      chapterRef.current = null
      chapterIdRef.current = null
      setChapter(null)
      setDraft('')
      setDirty(false)
      await refreshChapters(novelId)
      await refreshNovels(novelId)
      notify('info', result?.backupPath ? `${t('deletedNotice')} · ${result.backupPath}` : t('deletedNotice'))
    } catch (cause) {
      notify('error', causeText(cause))
    }
    })
  }, [runTransition, call, guardDirty, novelId, notify, refreshChapters, refreshNovels, t])

  const openNovelCreate = useCallback(() => {
    const form = novelForm({ title: '', author: status?.user?.username ?? '', genre: '玄幻', status: '连载中', intro: '' })
    setNovelDialog({ mode: 'create', id: null, form, initial: { ...form }, original: null, busy: false, error: '' })
  }, [status])

  const openNovelEdit = useCallback(() => {
    const row = novels.find(novel => novel.id === novelId)
    if (!row) return
    const form = novelForm(row)
    setNovelDialog({ mode: 'edit', id: row.id, form, initial: { ...form }, original: { ...row }, busy: false, error: '' })
  }, [novelId, novels])

  const setNovelField = useCallback((key, value) => {
    if (novelRequestRef.current || !writable) return
    setNovelDialog(current => current ? { ...current, form: { ...current.form, [key]: value }, error: '' } : current)
  }, [writable])

  const closeNovelDialog = useCallback(() => {
    if (!novelDialog || novelRequestRef.current || novelDialog.busy) return
    if (novelFormDirty(novelDialog.form, novelDialog.initial) && !window.confirm(t('novelDiscardChanges'))) return
    setNovelDialog(null)
  }, [novelDialog, t])

  const submitNovel = useCallback(async () => {
    if (!novelDialog || novelDialog.busy || novelRequestRef.current || !writable) return
    if (!novelDialog.form.title.trim()) {
      setNovelDialog(current => current ? { ...current, error: t('novelNameRequired') } : current)
      return
    }
    if (novelDialog.mode === 'edit' && !novelFormDirty(novelDialog.form, novelDialog.initial)) return
    const snapshot = novelDialog
    if (snapshot.mode === 'create' && outlineGuardRef.current && !(await outlineGuardRef.current())) return
    if (novelRequestRef.current) return
    const payload = novelPayload(snapshot.form, snapshot.mode === 'edit' ? snapshot.initial : undefined)
    novelRequestRef.current = true
    setNovelDialog(previous => previous ? { ...previous, busy: true, error: '' } : previous)
    let ownsTransition = false
    let committed = false
    try {
      if (snapshot.mode === 'create') {
        if (transitionRef.current) return
        transitionRef.current = true
        ownsTransition = true
        setTransitioning(true)
        if (!(await guardDirty())) return
      }
      const result = snapshot.mode === 'create'
        ? await call('createNovel', payload)
        : await call('updateNovel', { novelId: snapshot.id, ...payload })
      committed = true
      setNovelDialog(null)
      notify('info', t(snapshot.mode === 'create' ? 'createdNotice' : 'savedNotice'))
      if (snapshot.mode === 'create') {
        chapterRef.current = null
        chapterIdRef.current = null
        draftRef.current = ''
        dirtyRef.current = false
        setChapterId(null)
        setChapter(null)
        setDraft('')
        setDirty(false)
        setTab('body')
      }
      await refreshNovels(snapshot.mode === 'create' ? result.novel?.id : snapshot.id)
    } catch (cause) {
      if (committed) notify('error', t('novelSavedRefreshFailed'))
      else setNovelDialog(current => current && current.id === snapshot.id && current.mode === snapshot.mode
        ? { ...current, busy: false, error: causeText(cause) } : current)
    } finally {
      novelRequestRef.current = false
      if (ownsTransition) { transitionRef.current = false; setTransitioning(false) }
      if (!committed) setNovelDialog(current => current ? { ...current, busy: false } : current)
    }
  }, [guardDirty, call, novelDialog, notify, refreshNovels, t, writable])

  const deleteNovel = useCallback(async () => {
    const snapshot = novelDialog
    if (!snapshot || snapshot.mode !== 'edit' || snapshot.id == null || !writable || snapshot.busy || novelRequestRef.current) return
    const confirmation = t('novelDeleteConfirm').replace('{title}', snapshot.original?.title ?? snapshot.form.title)
    if (!window.confirm(confirmation)) return
    novelRequestRef.current = true
    setNovelDialog(current => current ? { ...current, busy: true, error: '' } : current)
    let committed = false
    try {
      await runTransition(async () => {
        await call('deleteNovel', { novelId: snapshot.id, confirm: true })
        committed = true
        setNovelDialog(null)
        chapterRef.current = null
        chapterIdRef.current = null
        draftRef.current = ''
        dirtyRef.current = false
        setChapterId(null)
        setChapter(null)
        setDraft('')
        setDirty(false)
        setTab('body')
        notify('info', t('deletedNotice'))
        await refreshNovels()
      })
    } catch (cause) {
      if (committed) notify('error', t('novelSavedRefreshFailed'))
      else setNovelDialog(current => current ? { ...current, error: causeText(cause), busy: false } : current)
    } finally {
      novelRequestRef.current = false
      if (!committed) setNovelDialog(current => current ? { ...current, busy: false } : current)
    }
  }, [runTransition, call, novelDialog, notify, refreshNovels, t, writable])

  const openChapterFromSearch = useCallback(async (targetNovelId, targetChapterId) => {
    if (targetNovelId === novelId && targetChapterId === chapterIdRef.current) { setTab('body'); return }
    if (targetNovelId !== novelId && outlineGuardRef.current && !(await outlineGuardRef.current())) return
    const ok = await guardDirty()
    if (!ok || transitionRef.current) return
    chapterRef.current = null
    chapterIdRef.current = targetChapterId
    draftRef.current = ''
    setChapter(null)
    setDraft('')
    setDirty(false)
    setConflict(null)
    setSaveState('idle')
    if (targetNovelId !== novelId) setNovelId(targetNovelId)
    setChapterId(targetChapterId)
    setTab('body')
  }, [guardDirty, novelId])

  const onChapterRestored = useCallback(async restored => {
    if (!restored || chapterIdRef.current !== restored.id) return
    if (dirtyRef.current) {
      setConflict({ currentUpdatedAt: restored.updatedAt })
      notify('info', t('externalChange'))
      return
    }
    adoptChapter(restored)
  }, [adoptChapter, notify, t])

  // ---- 查找替换 ----
  const findMatches = useMemo(() => {
    const query = findQuery
    if (!query) return []
    const list = []
    let from = 0
    while (list.length < 1000) {
      const at = draft.indexOf(query, from)
      if (at < 0) break
      list.push(at)
      from = at + Math.max(1, query.length)
    }
    return list
  }, [draft, findQuery])

  // 不经历史栈的写入：撤销/重做与内部恢复用。
  const applyDraft = useCallback(next => {
    if (transitionRef.current) return
    draftRef.current = next
    dirtyRef.current = next !== (chapterRef.current?.content ?? '')
    setDraft(next)
    setDirty(dirtyRef.current)
  }, [])

  // 用户可见的改写（AI、排版、查找替换、插入人物）：先记一份历史再写入。
  const editDraft = useCallback(next => {
    pushHistory(historyRef.current, draftRef.current, next)
    applyDraft(next)
  }, [applyDraft])

  const undo = useCallback(() => {
    if (transitionRef.current || !writable) return false
    const previous = undoHistory(historyRef.current, draftRef.current)
    if (previous === null) return false
    applyDraft(previous)
    return true
  }, [applyDraft, writable])

  const redo = useCallback(() => {
    if (transitionRef.current || !writable) return false
    const next = redoHistory(historyRef.current, draftRef.current)
    if (next === null) return false
    applyDraft(next)
    return true
  }, [applyDraft, writable])

  // ---- 一键排版：与起笔一致，每段首行清掉前导空白再补两个全角空格 ----
  const autoFormat = useCallback(() => {
    const doc = draftRef.current
    if (!doc) return
    const formatted = doc
      .split(/\r?\n/)
      .map(line => {
        const trimmed = line.trim()
        if (!trimmed) return ''
        // Markdown 结构行不强加中文缩进。
        if (/^#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s|^>\s|^```|^---\s*$|^\|/.test(trimmed)) return trimmed
        return `　　${trimmed}`
      })
      .join('\n')
    if (formatted !== doc) editDraft(formatted)
  }, [editDraft])

  const selectMatch = useCallback((index) => {
    const editor = editorRef.current
    if (!editor || findMatches.length === 0) return
    const normalized = ((index % findMatches.length) + findMatches.length) % findMatches.length
    const at = findMatches[normalized]
    editor.focus()
    editor.setSelectionRange(at, at + findQuery.length)
    editor.scrollTop = Math.max(0, (draft.length ? at / draft.length : 0) * editor.scrollHeight - editor.clientHeight / 2)
  }, [draft.length, findMatches, findQuery.length])

  const openFind = useCallback((focusReplace) => {
    setFindOpen(true)
    setFindIndex(0)
    const editor = editorRef.current
    if (editor && editor.selectionStart !== editor.selectionEnd) {
      const selected = draft.slice(editor.selectionStart, editor.selectionEnd)
      if (selected && !selected.includes('\n')) {
        setFindQuery(selected)
        return
      }
    }
    if (focusReplace) setTimeout(() => { editor?.focus() }, 0)
  }, [draft])

  const findStep = useCallback(direction => {
    if (findMatches.length === 0) return
    const next = findIndex + direction
    setFindIndex(next)
    selectMatch(next)
  }, [findIndex, findMatches.length, selectMatch])

  const replaceOne = useCallback(() => {
    if (findMatches.length === 0) return
    const at = findMatches[Math.min(Math.max(findIndex, 0), findMatches.length - 1)]
    const next = `${draft.slice(0, at)}${findReplace}${draft.slice(at + findQuery.length)}`
    editDraft(next)
    setTimeout(() => selectMatch(findIndex), 0)
    notify('info', t('findReplacedOne'))
  }, [draft, editDraft, findIndex, findMatches, findQuery.length, findReplace, notify, selectMatch, t])

  const replaceAll = useCallback(() => {
    if (findMatches.length === 0) return
    const count = findMatches.length
    editDraft(draft.split(findQuery).join(findReplace))
    setFindIndex(0)
    notify('info', t('findReplacedAll').replace('{n}', String(count)))
  }, [draft, editDraft, findMatches.length, findQuery, findReplace, notify, t])

  // ---- 右键菜单与 AI ----
  const onEditorContextMenu = useCallback(event => {
    const editor = editorRef.current
    if (!editor) return
    const { selectionStart, selectionEnd } = editor
    if (selectionStart === selectionEnd) return
    const text = draft.slice(selectionStart, selectionEnd)
    if (!text.trim()) return
    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY, from: selectionStart, to: selectionEnd, text })
  }, [draft])

  const openAi = useCallback((selection, initialMode) => {
    setAiSelection(selection ?? null)
    setAiInitialMode(initialMode ?? null)
    setAiOpen(true)
    setContextMenu(null)
    const sequence = ++aiInfoSequence.current
    setAiInfoLoading(true)
    void call('aiInfo', {}).then(next => {
      if (sequence === aiInfoSequence.current) setAiInfo(next)
    }).catch(cause => {
      if (sequence === aiInfoSequence.current) {
        setAiInfo(null)
        notify('error', causeText(cause))
      }
    }).finally(() => {
      if (sequence === aiInfoSequence.current) setAiInfoLoading(false)
    })
  }, [call, notify])

  // AI 写回后给一次「撤销」出口：记住写回前的正文与所属章节。
  const showUndo = useCallback((previous, appliedChapterId, messageKey) => {
    setNotice({
      kind: 'info',
      text: t(messageKey),
      action: {
        label: t('undo'),
        onClick: () => {
          if (chapterIdRef.current !== appliedChapterId) {
            setNotice({ kind: 'error', text: t('undoWrongChapter') })
            return
          }
          editDraft(previous)
          setNotice({ kind: 'info', text: t('undone') })
        },
      },
    })
  }, [editDraft, t])

  // 把 AI 生成结果另存为一条版本，未应用/已应用都能在版本历史里找回。
  const recordAiRevision = useCallback((text, label) => {
    const target = chapterIdRef.current
    if (target == null || !String(text ?? '').trim()) return
    void call('addRevision', {
      chapterId: target,
      content: String(text),
      reason: `AI 生成 · ${label || '正文'}`,
    }).catch(cause => notify('error', causeText(cause)))
  }, [call, notify])

  const applyAi = useCallback(async ({ mode, modeLabel, text, rewrite, report, selection, sourceNovelId, sourceChapterId }) => {
    if (!writable || transitionRef.current || sourceNovelId !== novelId || sourceChapterId !== chapterIdRef.current) { notify('error', t('aiSourceChanged')); return }
    const result = String(text ?? '').trim()
    if (!result) return
    if (report) {
      try {
        await call('createOutline', {
          novelId,
          chapterId: mode === 'outline' ? chapterId : null,
          title: `AI ${t('aiOutlineTitle')} · ${new Date().toLocaleDateString()}`,
          content: result,
        })
        notify('info', t('aiSavedOutline'))
      } catch (cause) {
        notify('error', causeText(cause))
      }
      return
    }
    if (selection) {
      const current = draftRef.current
      if (current.slice(selection.from, selection.to) !== selection.text) {
        notify('error', t('aiSelectionStale'))
        return
      }
      const next = `${current.slice(0, selection.from)}${result}${current.slice(selection.to)}`
      editDraft(next)
      recordAiRevision(result, modeLabel)
      setAiOpen(false)
      setAiSelection(null)
      showUndo(current, chapterIdRef.current, 'aiAppliedSelection')
      return
    }
    const current = draftRef.current
    const next = rewrite === false ? `${current}${current ? '\n' : ''}${result}` : result
    editDraft(next)
    recordAiRevision(result, modeLabel)
    setAiOpen(false)
    showUndo(current, chapterIdRef.current, 'aiAppliedHint')
  }, [call, chapterId, editDraft, novelId, notify, recordAiRevision, showUndo, t, writable])

  const copySelection = useCallback(async () => {
    if (!contextMenu) return
    try {
      await navigator.clipboard.writeText(contextMenu.text)
      setContextMenu(null)
    } catch (cause) {
      notify('error', causeText(cause))
    }
  }, [contextMenu, notify])

  const cutSelection = useCallback(async () => {
    if (!contextMenu) return
    try {
      await navigator.clipboard.writeText(contextMenu.text)
      const current = draftRef.current
      editDraft(`${current.slice(0, contextMenu.from)}${current.slice(contextMenu.to)}`)
      setContextMenu(null)
    } catch (cause) {
      notify('error', causeText(cause))
    }
  }, [contextMenu, editDraft, notify])

  // ---- 渲染 ----
  const activeNovel = novels.find(row => row.id === novelId) ?? null
  const wordCount = draft.length
  const editable = writable && !transitioning && conflict === null && chapter !== null
  const saveLabel = saveState === 'saving'
    ? t('saving')
    : saveState === 'error'
      ? t('saveFailed')
      : dirty
        ? t('unsaved')
        : saveState === 'saved' ? t('saved') : ''

  // 侧栏筛选与排序：作品按最近更新，章节按目录顺序。
  const visibleNovels = useMemo(() => {
    const query = novelQuery.trim().toLowerCase()
    const rows = query
      ? novels.filter(row => String(row.title ?? '').toLowerCase().includes(query)
        || String(row.genre ?? '').toLowerCase().includes(query))
      : novels
    return rows.slice().sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
  }, [novels, novelQuery])

  const visibleChapters = useMemo(() => {
    const query = chapterQuery.trim().toLowerCase()
    if (!query) return chapters
    return chapters.filter(row => String(row.title ?? '').toLowerCase().includes(query))
  }, [chapters, chapterQuery])

  const anchors = useMemo(
    () => matchOutlineAnchors(draft, outlines, outlineMarkers, chapterId),
    [draft, outlines, outlineMarkers, chapterId],
  )

  const chapterPosition = chapters.findIndex(row => row.id === chapterId)
  const previousChapter = chapterPosition > 0 ? chapters[chapterPosition - 1] : null
  const nextChapter = chapterPosition >= 0 && chapterPosition < chapters.length - 1
    ? chapters[chapterPosition + 1]
    : null
  const locateChapter = () => {
    setChapterQuery('')
    if (typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        document.querySelector('.qibi-chapter.active')?.scrollIntoView({ block: 'center' })
      })
    }
  }

  // 点出场人物：把名字插到光标处（只读时不响应）。
  const insertCastName = name => {
    const editor = editorRef.current
    if (!editor || !editable) return
    const current = draftRef.current
    const at = typeof editor.selectionStart === 'number' ? editor.selectionStart : current.length
    editDraft(`${current.slice(0, at)}${name}${current.slice(at)}`)
    requestAnimationFrame(() => {
      editor.focus()
      const next = at + name.length
      editor.setSelectionRange(next, next)
    })
  }

  // 点细纲锚点：定位到正文里的 marker；没找到可当场改一个更精确的标记。
  const jumpToAnchor = anchor => {
    const editor = editorRef.current
    const text = draftRef.current
    if (!editor) return
    if (!anchor.marker) {
      setNotice({ kind: 'error', text: t('anchorNoMarker') })
      return
    }
    const pos = text.indexOf(anchor.marker)
    if (pos < 0) {
      setNotice({
        kind: 'info',
        text: t('anchorMissing').replace('{marker}', anchor.marker),
        action: { label: t('anchorSet'), onClick: () => setMarkerEditing({ id: anchor.id, value: '' }) },
      })
      return
    }
    editor.focus()
    editor.setSelectionRange(pos, pos + anchor.marker.length)
    editor.scrollTop = Math.max(0, (text.length ? pos / text.length : 0) * editor.scrollHeight - editor.clientHeight / 2)
  }

  const saveMarker = () => {
    if (!markerEditing) return
    const value = markerEditing.value.trim()
    setOutlineMarkers(previous => {
      const next = { ...previous }
      if (value) next[markerEditing.id] = value
      else delete next[markerEditing.id]
      return next
    })
    setMarkerEditing(null)
  }

  // 页签支持左右方向键切换（标准 tablist 行为）。
  const onTabKey = event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const index = TABS.findIndex(([key]) => key === tab)
    const step = event.key === 'ArrowRight' ? 1 : -1
    const nextKey = TABS[(index + step + TABS.length) % TABS.length][0]
    setTab(nextKey)
    if (typeof document !== 'undefined') {
      requestAnimationFrame(() => document.getElementById(`qibi-tab-${nextKey}`)?.focus())
    }
  }

  const novelDirty = novelDialog ? novelFormDirty(novelDialog.form, novelDialog.initial) : false
  const novelDialogNode = novelDialog ? (
    <Dialog
      title={novelDialog.mode === 'create' ? t('newNovel') : t('novelSettings')}
      className="qibi-novel-settings-dialog"
      busy={novelDialog.busy}
      onClose={closeNovelDialog}
      footer={(
        <>
          <span className="qibi-sub qibi-settings-save-state">{t(novelDialog.busy ? 'saving' : !writable ? 'novelReadOnlyState' : novelDirty ? 'unsaved' : 'novelNoChanges')}</span>
          <span className="qibi-spacer" />
          <button type="button" className="qibi-btn" disabled={novelDialog.busy} onClick={closeNovelDialog}>{t(novelDirty ? 'cancel' : 'close')}</button>
          <button type="submit" form={novelFormId} className="qibi-btn primary" disabled={!writable || novelDialog.busy || (novelDialog.mode === 'edit' && !novelDirty)}>{t(novelDialog.busy ? 'saving' : novelDialog.mode === 'create' ? 'novelCreateAction' : 'novelSaveAction')}</button>
        </>
      )}
    >
      <NovelSettingsFields
        formId={novelFormId} form={novelDialog.form} initial={novelDialog.original}
        mode={novelDialog.mode} writable={writable} busy={novelDialog.busy} error={novelDialog.error}
        onField={setNovelField} onSubmit={submitNovel} onDelete={deleteNovel} t={t}
      />
    </Dialog>
  ) : null

  const chapterDialogNode = chapterDialog && chapter ? (
    <Dialog
      title={t('chapterSettings')}
      busy={chapterDialog.busy}
      onClose={() => { if (!chapterDialog.busy) setChapterDialog(null) }}
      footer={(
        <>
          <span className="qibi-spacer" />
          <button type="button" className="qibi-btn small" disabled={chapterDialog.busy} onClick={() => setChapterDialog(null)}>{t('cancel')}</button>
          <button type="button" className="qibi-btn small primary" disabled={chapterDialog.busy} onClick={() => void submitChapter()}>{t('save')}</button>
        </>
      )}
    >
      <div className="qibi-form">
        <Field label={t('chapterTitle')}>
          <input
            className="qibi-input"
            value={chapterDialog.form.title}
            onChange={event => setChapterDialog(current => (current ? { ...current, form: { ...current.form, title: event.target.value } } : current))}
          />
        </Field>
        <Field label={t('chapterStatus')}>
          <select
            className="qibi-select"
            value={chapterDialog.form.status}
            onChange={event => setChapterDialog(current => (current ? { ...current, form: { ...current.form, status: event.target.value } } : current))}
          >
            {chapterStatusOptions(chapter.status).map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </Field>
        {continuity.enabled && <span className="qibi-sub">{t('continuityOrganizerPublishEnabled')}</span>}
      </div>
    </Dialog>
  ) : null

  const dataSettingsDialogNode = dataSettingsOpen ? (
    <Dialog title={t('dataSettingsTitle')} busy={dataSettingsBusy} onClose={() => { if (!dataSettingsBusy) setDataSettingsOpen(false) }}>
      <DataSettings
        key={`data-settings-${loadEpoch}`}
        call={call}
        t={t}
        onBeforeSave={beforeDataSettingsSave}
        onSaved={finishDataSettingsSave}
        onCancel={() => setDataSettingsOpen(false)}
        onBusyChange={setDataSettingsBusy}
      />
    </Dialog>
  ) : null

  if (phase === 'loading') {
    return <div className="qibi-root"><div className="qibi-bar"><span className="qibi-title">{t('panel')}</span><span className="qibi-spacer" /><ThemeButton appearance={appearance} t={t} /></div><div className="qibi-empty">{t('loading')}</div></div>
  }

  if (phase === 'nodb') {
    return (
      <div className="qibi-root qibi-setup-root">
        <div className="qibi-bar"><span className="qibi-title">{t('panel')}</span><span className="qibi-spacer" /><ThemeButton appearance={appearance} t={t} /></div>
        <div className="qibi-empty">
          <strong>{t('noDb')}</strong>
          <span>{t('noDbHint').replace('{path}', status?.dbPath ?? status?.dataDir ?? '')}</span>
          <code className="qibi-code">{status?.dbPath}</code>
        </div>
        <div className="qibi-card">
          <strong>{t('dataSettingsTitle')}</strong>
          <DataSettings
            key={`data-settings-inline-${loadEpoch}`}
            call={call}
            t={t}
            onBeforeSave={beforeDataSettingsSave}
            onSaved={finishDataSettingsSave}
          />
        </div>
        {dataSettingsDialogNode}
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="qibi-root">
        <div className="qibi-bar"><span className="qibi-title">{t('panel')}</span><span className="qibi-spacer" /><ThemeButton appearance={appearance} t={t} /></div>
        <div className="qibi-empty">
          <strong>{t('error')}</strong>
          <span>{error?.message ?? ''}</span>
          <div className="qibi-actions" style={{ marginTop: 12 }}>
            <button type="button" className="qibi-btn" onClick={retryStatus}>{t('retry')}</button>
            <button type="button" className="qibi-btn primary" onClick={() => setDataSettingsOpen(true)}>{t('dataSettingsOpen')}</button>
          </div>
        </div>
        {dataSettingsDialogNode}
      </div>
    )
  }

  if (phase === 'empty') {
    return (
      <div className="qibi-root">
        <div className="qibi-bar">
          <span className="qibi-title">{t('panel')}</span>
          <span className="qibi-spacer" />
          <button
            type="button"
            className="qibi-chip"
            aria-pressed={writable}
            onClick={() => void toggleWritable()}
            disabled={!status?.configWritable}
            title={status?.configWritable ? t('writeToggleHint') : 'config.allowWrite = false'}
          >
            <span className={`qibi-chip-dot${writable ? ' on' : ''}`} />
            {writable ? t('writeOn') : t('writeOff')}
          </button>
          <ThemeButton appearance={appearance} t={t} />
          <button type="button" className="qibi-btn small" onClick={() => setDataSettingsOpen(true)}>{t('dataSettingsOpen')}</button>
          <button type="button" className="qibi-btn small" disabled={!writable} onClick={openNovelCreate}>＋ {t('newNovel')}</button>
        </div>
        <div className="qibi-empty">
          <strong>{t('emptyNovel')}</strong>
          <span>{t('emptyNovelHint')}</span>
          <div style={{ marginTop: 12 }}>
            <button type="button" className="qibi-btn" disabled={!writable} onClick={openNovelCreate}>{t('newNovel')}</button>
          </div>
        </div>
        {novelDialogNode}
        {dataSettingsDialogNode}
      </div>
    )
  }

  return (
    <div className={`qibi-root${zen ? ' zen' : ''}`}>
      <div className="qibi-bar">
        <span className="qibi-title">{t('panel')}</span>
        <span className="qibi-sub">{activeNovel ? `《${activeNovel.title}》· ${activeNovel.chapterCount} ${t('chapters')} · ${formatWords(activeNovel.wordCount)} ${t('words')}` : ''}</span>
        <span className="qibi-spacer" />
        <ThemeButton appearance={appearance} t={t} />
        <button type="button" className="qibi-btn small" onClick={async () => { if (await guardDirty()) setDataSettingsOpen(true) }}>{t('dataSettingsOpen')}</button>
        <button type="button" className="qibi-btn small" disabled={!activeNovel} onClick={openNovelEdit}>{t('novelSettings')}</button>
        <button
          type="button"
          className="qibi-chip"
          aria-pressed={writable}
          onClick={() => void toggleWritable()}
          disabled={!status?.configWritable}
          title={status?.configWritable ? t('writeToggleHint') : 'config.allowWrite = false'}
        >
          <span className={`qibi-chip-dot${writable ? ' on' : ''}`} />
          {writable ? t('writeOn') : t('writeOff')}
        </button>
        <button type="button" className="qibi-btn small" onClick={() => void reload()}>{t('reload')}</button>
      </div>

      {conflict && (
        <div className="qibi-banner">
          <strong>{t('conflict')}</strong>
          <span className="qibi-sub">{t('conflictHint')}</span>
          <span className="qibi-spacer" />
          <button
            type="button"
            className="qibi-btn small"
            onClick={() => {
              if (dirtyRef.current && !window.confirm(t('discardDraftConfirm'))) return
              void reload({ force: true })
            }}
          >{t('reload')}</button>
          <button type="button" className="qibi-btn small primary" onClick={() => { void save({ force: true }) }}>{t('overwrite')}</button>
        </div>
      )}
      {notice && (
        <div
          className={`qibi-notice${notice.kind === 'error' ? ' error' : ''}`}
          role={notice.kind === 'error' ? 'alert' : 'status'}
        >
          <span>{notice.text}</span>
          {notice.action && (
            <button
              type="button"
              className="qibi-btn small"
              onClick={() => notice.action.onClick()}
            >{notice.action.label}</button>
          )}
          <button type="button" className="qibi-btn small" aria-label={t('close')} onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      <div className="qibi-body">
        <div className="qibi-side">
          <div className="qibi-side-block novels">
            <div className="qibi-side-head">
              <span>{t('novels')}</span>
              <span className="qibi-spacer" />
              <button type="button" className="qibi-btn small" disabled={!writable} onClick={openNovelCreate} title={t('newNovel')}>＋</button>
            </div>
            <div className="qibi-side-search">
              <input
                className="qibi-input"
                value={novelQuery}
                placeholder={t('filterNovels')}
                onChange={event => setNovelQuery(event.target.value)}
                onKeyDown={event => { if (event.key === 'Escape') setNovelQuery('') }}
              />
            </div>
            <div className="qibi-list">
              {visibleNovels.length === 0 && <div className="qibi-side-note">{t('noMatch')}</div>}
              {visibleNovels.map(novel => (
                <button
                  key={novel.id}
                  type="button"
                  className={`qibi-novel${novel.id === novelId ? ' active' : ''}`}
                  onClick={() => { void chooseNovel(novel.id) }}
                >
                  <span className="qibi-novel-name">《{novel.title}》</span>
                  <span className="qibi-novel-meta">{novel.genre} · {formatWords(novel.wordCount)} {t('words')}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="qibi-side-block chapters">
            <div className="qibi-side-subhead">
              <span>{t('chapters')}</span>
              <span className="qibi-sub">{chapters.length}</span>
              <span className="qibi-spacer" />
              <button type="button" className="qibi-btn small" onClick={locateChapter} title={t('locateChapter')} aria-label={t('locateChapter')}>◎</button>
              <button
                type="button"
                className="qibi-btn small"
                disabled={!writable}
                onClick={() => { setCreating(value => !value); setNewTitle('') }}
                title={t('newChapter')}
              >＋</button>
            </div>
            <div className="qibi-side-search">
              <input
                className="qibi-input"
                value={chapterQuery}
                placeholder={t('filterChapters')}
                onChange={event => setChapterQuery(event.target.value)}
                onKeyDown={event => { if (event.key === 'Escape') setChapterQuery('') }}
              />
            </div>
            <div className="qibi-list">
              {visibleChapters.length === 0 && (
                <div className="qibi-side-note">{chapters.length === 0 ? t('emptyChapter') : t('noMatch')}</div>
              )}
              {visibleChapters.map(row => (
                <button
                  key={row.id}
                  type="button"
                  className={`qibi-chapter${row.id === chapterId ? ' active' : ''}`}
                  onClick={() => { void chooseChapter(row.id) }}
                >
                  <span className={`qibi-dot${row.status === '已发布' ? ' published' : ''}`} />
                  <span className="qibi-chapter-name">{row.title}</span>
                  <span className="qibi-chapter-words">{formatWords(row.wordCount)}</span>
                </button>
              ))}
            </div>
          </div>
          {creating && novelId !== null && (
            <div className="qibi-newrow">
              <input
                autoFocus
                className="qibi-input"
                value={newTitle}
                placeholder={t('newChapterPrompt')}
                onChange={event => setNewTitle(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') void createChapter()
                  if (event.key === 'Escape') { setCreating(false); setNewTitle('') }
                }}
              />
              <button type="button" className="qibi-btn small primary" onClick={() => { void createChapter() }}>✓</button>
            </div>
          )}
        </div>

        <div className="qibi-main">
          <div className="qibi-main-head">
            {chapter ? (
              <>
                <span className="qibi-chapter-title" title={chapter.title}>{chapter.title}</span>
                <span className="qibi-chip">{chapter.status || t('statusDraft')}</span>
                <span className="qibi-sub">
                  {formatWords(wordCount)} {t('words')}
                  {saveLabel ? ` · ${saveLabel}` : ''} · {chapter.updatedAt}
                </span>
                <span className="qibi-spacer" />
                {aiInfo?.available && (
                  <button type="button" className="qibi-btn small primary" onClick={() => openAi(null)}>{t('aiButton')}</button>
                )}
                <button type="button" className="qibi-btn small" onClick={() => openFind(false)} title={t('findTitle')}>{t('findTitle')}</button>
                <button type="button" className="qibi-btn small" onClick={autoFormat} title={t('formatTitle')} disabled={!draft}>{t('format')}</button>
                <button type="button" className="qibi-btn small" onClick={() => { setZen(value => !value); setTab('body') }} title={t('zenHint')}>{zen ? t('zenOff') : t('zen')}</button>
                <div className="qibi-menu-wrap">
                  <button
                    type="button"
                    className="qibi-btn small"
                    aria-haspopup="menu"
                    aria-expanded={chapterMenu}
                    aria-label={t('more')}
                    onClick={event => { event.stopPropagation(); setChapterMenu(value => !value) }}
                  >⋯</button>
                  {chapterMenu && (
                    <div className="qibi-menu" role="menu" onClick={event => event.stopPropagation()}>
                      <button type="button" role="menuitem" disabled={!editable} onClick={() => { setChapterMenu(false); undo(); editorRef.current?.focus() }}>{t('undo')}<span className="qibi-sub"> Ctrl+Z</span></button>
                      <button type="button" role="menuitem" disabled={!editable} onClick={() => { setChapterMenu(false); redo(); editorRef.current?.focus() }}>{t('redo')}<span className="qibi-sub"> Ctrl+Y</span></button>
                      <div className="qibi-menu-sep" />
                      <button type="button" role="menuitem" disabled={!previousChapter} onClick={() => { setChapterMenu(false); if (previousChapter) void chooseChapter(previousChapter.id) }}>{t('previousChapter')}</button>
                      <button type="button" role="menuitem" disabled={!nextChapter} onClick={() => { setChapterMenu(false); if (nextChapter) void chooseChapter(nextChapter.id) }}>{t('nextChapter')}</button>
                      <div className="qibi-menu-sep" />
                      <button type="button" role="menuitem" disabled={!writable} onClick={() => { setChapterMenu(false); void moveChapter('up') }}>{t('moveUp')}</button>
                      <button type="button" role="menuitem" disabled={!writable} onClick={() => { setChapterMenu(false); void moveChapter('down') }}>{t('moveDown')}</button>
                      <button type="button" role="menuitem" disabled={!writable} onClick={() => { setChapterMenu(false); void openChapterEdit() }}>{t('edit')}</button>
                      <div className="qibi-menu-sep" />
                      <button type="button" role="menuitem" className="danger" disabled={!writable} onClick={() => { setChapterMenu(false); void deleteChapter() }}>{t('delete')}</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span className="qibi-sub">{t('noChapterSelected')}</span>
            )}
          </div>

          {chapter && !editable && (
            <div className="qibi-readonly-bar">
              {!writable ? t('readonlyWriteOff') : t('readonlyConflict')}
            </div>
          )}

          <div className="qibi-tabs" role="tablist" aria-label={t('panel')} onKeyDown={onTabKey}>
            {TABS.map(([key, labelKey]) => (
              <button
                key={key}
                id={`qibi-tab-${key}`}
                type="button"
                role="tab"
                aria-selected={tab === key}
                aria-controls={`qibi-pane-${key}`}
                tabIndex={tab === key ? 0 : -1}
                className={`qibi-tab${tab === key ? ' active' : ''}`}
                onClick={() => setTab(key)}
              >{t(labelKey)}</button>
            ))}
          </div>

          <div className="qibi-tabpane" id="qibi-pane-body" role="tabpanel" aria-labelledby="qibi-tab-body" style={{ display: tab === 'body' ? 'flex' : 'none' }}>
            {chapter ? (
              <>
                {findOpen && (
                  <div className="qibi-find">
                    <input
                      autoFocus
                      className="qibi-input"
                      value={findQuery}
                      placeholder={t('findPlaceholder')}
                      onChange={event => { setFindQuery(event.target.value); setFindIndex(0) }}
                      onKeyDown={event => {
                        if (event.key === 'Enter') { event.preventDefault(); findStep(event.shiftKey ? -1 : 1) }
                        if (event.key === 'Escape') setFindOpen(false)
                      }}
                    />
                    <span className="qibi-sub qibi-find-count">
                      {findMatches.length ? `${Math.min(Math.abs(findIndex) % findMatches.length + 1, findMatches.length)}/${findMatches.length}` : '0/0'}
                    </span>
                    <button type="button" className="qibi-btn small" disabled={!findMatches.length} onClick={() => findStep(-1)} title={t('findPrev')}>↑</button>
                    <button type="button" className="qibi-btn small" disabled={!findMatches.length} onClick={() => findStep(1)} title={t('findNext')}>↓</button>
                    <input
                      className="qibi-input"
                      value={findReplace}
                      placeholder={t('findReplacePlaceholder')}
                      onChange={event => setFindReplace(event.target.value)}
                      onKeyDown={event => { if (event.key === 'Escape') setFindOpen(false) }}
                    />
                    <button type="button" className="qibi-btn small" disabled={!writable || !findMatches.length} onClick={replaceOne}>{t('findReplaceOne')}</button>
                    <button type="button" className="qibi-btn small" disabled={!writable || !findMatches.length} onClick={replaceAll}>{t('findReplaceAll')}</button>
                    <button type="button" className="qibi-btn small" onClick={() => setFindOpen(false)}>×</button>
                  </div>
                )}
                {cast.length > 0 && (
                  <div className="qibi-cast">
                    <span className="qibi-sub">{t('castThisChapter')}</span>
                    {cast.map(row => (
                      <button
                        type="button"
                        key={row.id}
                        className="qibi-chip"
                        disabled={!editable}
                        title={row.alias ? `${row.name} · ${row.alias}` : row.name}
                        onClick={() => insertCastName(row.name)}
                      >{row.name} ×{row.count}</button>
                    ))}
                  </div>
                )}
                {anchors.length > 0 && (
                  <div className="qibi-anchors">
                    <span className="qibi-sub">{t('outlineAnchors')}</span>
                    {anchors.map(anchor => (
                      markerEditing?.id === anchor.id ? (
                        <span className="qibi-anchor-form" key={anchor.id}>
                          <input
                            autoFocus
                            className="qibi-input"
                            value={markerEditing.value}
                            placeholder={anchor.title.slice(0, 8) || t('anchorPlaceholder')}
                            onChange={event => setMarkerEditing({ id: anchor.id, value: event.target.value })}
                            onKeyDown={event => {
                              if (event.key === 'Enter') saveMarker()
                              if (event.key === 'Escape') setMarkerEditing(null)
                            }}
                          />
                          <button type="button" className="qibi-btn small primary" onClick={saveMarker}>✓</button>
                          <button type="button" className="qibi-btn small" aria-label={t('cancel')} onClick={() => setMarkerEditing(null)}>×</button>
                        </span>
                      ) : (
                        <span className="qibi-anchor" key={anchor.id}>
                          <button
                            type="button"
                            className={`qibi-chip${anchor.done ? ' done' : ''}`}
                            title={anchor.done ? t('anchorDoneHint') : t('anchorTodoHint')}
                            onClick={() => jumpToAnchor(anchor)}
                          >
                            <span className={`qibi-dot${anchor.done ? ' published' : ''}`} />
                            {anchor.title || anchor.marker || `#${anchor.id}`}
                          </button>
                          <button
                            type="button"
                            className="qibi-anchor-edit"
                            title={t('anchorSet')}
                            aria-label={t('anchorSet')}
                            onClick={() => setMarkerEditing({ id: anchor.id, value: anchor.custom ? anchor.marker : '' })}
                          >✎</button>
                        </span>
                      )
                    ))}
                  </div>
                )}
                <div className="qibi-editor-wrap">
                  <textarea
                    ref={editorRef}
                    className="qibi-editor"
                    value={draft}
                    readOnly={!editable}
                    spellCheck={false}
                    placeholder={t('emptyBody')}
                    onChange={event => {
                      if (transitionRef.current) return
                      const next = event.target.value
                      pushTypingHistory(historyRef.current, draftRef.current, next, Date.now())
                      draftRef.current = next
                      setDraft(next)
                      dirtyRef.current = next !== (chapterRef.current?.content ?? '')
                      setDirty(dirtyRef.current)
                    }}
                    onBlur={() => { if (dirtyRef.current && !conflict) void save() }}
                    onContextMenu={onEditorContextMenu}
                    onKeyDown={event => {
                      const mod = event.ctrlKey || event.metaKey
                      if (mod && !event.altKey) {
                        const key = event.key.toLowerCase()
                        if (key === 'z') {
                          event.preventDefault()
                          if (event.shiftKey) redo()
                          else undo()
                          return
                        }
                        if (key === 'y') {
                          event.preventDefault()
                          redo()
                          return
                        }
                      }
                      if (mod && (event.key === 'f' || event.key === 'F')) {
                        event.preventDefault()
                        openFind(false)
                      } else if (mod && (event.key === 'h' || event.key === 'H')) {
                        event.preventDefault()
                        openFind(true)
                      } else if (event.key === 'Escape' && findOpen) {
                        setFindOpen(false)
                      }
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="qibi-empty">
                <strong>{t('emptyChapter')}</strong>
                <span>{t('noChapterHint')}</span>
              </div>
            )}
          </div>

          <div className="qibi-tabpane" id="qibi-pane-outline" role="tabpanel" aria-labelledby="qibi-tab-outline" style={{ display: tab === 'outline' ? 'flex' : 'none' }}>
            <OutlineTab key={novelId} call={call} novelId={novelId} chapterId={chapterId} registerGuard={registerOutlineGuard} chapters={chapters} writable={writable} active={tab === 'outline'} notify={notify} t={t} />
          </div>

          <div className="qibi-tabpane" id="qibi-pane-characters" role="tabpanel" aria-labelledby="qibi-tab-characters" style={{ display: tab === 'characters' ? 'flex' : 'none' }}>
            <CharactersTab key={novelId} call={call} novelId={novelId} chapterId={chapterId} writable={writable} active={tab === 'characters'} notify={notify} t={t} guard={guardDirty} />
          </div>

          <div className="qibi-tabpane" id="qibi-pane-distill" role="tabpanel" aria-labelledby="qibi-tab-distill" style={{ display: tab === 'distill' ? 'flex' : 'none' }}>
            <DistillTab key={novelId} call={call} novelId={novelId} writable={writable} active={tab === 'distill'} notify={notify} t={t} />
          </div>

          <div className="qibi-tabpane" id="qibi-pane-continuity" role="tabpanel" aria-labelledby="qibi-tab-continuity" style={{ display: tab === 'continuity' ? 'flex' : 'none' }}>
            <ContinuityTab key={novelId} call={call} novelId={novelId} chapterId={chapterId} chapter={chapter} chapterDirty={dirty} organizer={{ ...continuity, organize: () => continuity.enqueue(chapterRef.current) }} writable={writable} active={tab === 'continuity'} notify={notify} t={t} />
          </div>

          <div className="qibi-tabpane" id="qibi-pane-search" role="tabpanel" aria-labelledby="qibi-tab-search" style={{ display: tab === 'search' ? 'flex' : 'none' }}>
            <SearchTab key={novelId} call={call} novelId={novelId} writable={writable} active={tab === 'search'} notify={notify} onOpenChapter={openChapterFromSearch} t={t} />
          </div>

          <div className="qibi-tabpane" id="qibi-pane-revisions" role="tabpanel" aria-labelledby="qibi-tab-revisions" style={{ display: tab === 'revisions' ? 'flex' : 'none' }}>
            <RevisionsTab key={chapterId ?? 'none'} call={call} chapterId={chapterId} writable={writable} active={tab === 'revisions'} notify={notify} onRestored={onChapterRestored} guard={guardDirty} t={t} />
          </div>

          <div className="qibi-tabpane" id="qibi-pane-export" role="tabpanel" aria-labelledby="qibi-tab-export" style={{ display: tab === 'export' ? 'flex' : 'none' }}>
            <ExportTab key={novelId} call={call} novelId={novelId} notify={notify} t={t} />
          </div>
        </div>
      </div>

      <div className="qibi-foot">
        <span>{status?.dataDir}</span>
        <span className="qibi-spacer" />
        <span>{status?.user ? `${status.user.username}` : ''}</span>
      </div>

      {contextMenu && (
        <div
          className="qibi-context"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 260) }}
          onClick={event => event.stopPropagation()}
        >
          <div className="qibi-context-label">“{contextMenu.text.slice(0, 16)}{contextMenu.text.length > 16 ? '…' : ''}”</div>
          {aiInfo?.available && (
            <>
              <button type="button" onClick={() => openAi({ ...contextMenu }, 'deslop-selection')}>{t('aiDeslop')}</button>
              <button type="button" onClick={() => openAi({ ...contextMenu }, 'polish-selection')}>{t('aiPolish')}</button>
              <button type="button" onClick={() => openAi({ ...contextMenu }, 'expand-selection')}>{t('aiExpand')}</button>
              <div className="qibi-context-sep" />
            </>
          )}
          <button type="button" onClick={() => void copySelection()}>{t('copySelection')}</button>
          <button type="button" onClick={() => void cutSelection()}>{t('cutSelection')}</button>
          <button
            type="button"
            onClick={() => {
              setFindQuery(contextMenu.text)
              setFindOpen(true)
              setContextMenu(null)
            }}
          >{t('findSelected')}</button>
        </div>
      )}

      {aiOpen && (
        <AiDrawer
          key={`${status?.dbPath}:${novelId}:${chapterId}`}
          historyScope={JSON.stringify([status?.dbPath, status?.user?.id, novelId])}
          call={call}
          novelId={novelId}
          chapterId={chapterId}
          draft={draft}
          selection={aiSelection}
          initialMode={aiInitialMode}
          writable={writable}
          info={aiInfo}
          modelLoading={aiInfoLoading}
          hasOutline={outlines.some(row => row.chapterId === chapterId)}
          t={t}
          notify={notify}
          onApply={applyAi}
          onClose={() => { setAiOpen(false); setAiSelection(null); setAiInitialMode(null) }}
        />
      )}

      {novelDialogNode}
      {chapterDialogNode}
      {dataSettingsDialogNode}
    </div>
  )
}

/** 载入面板样式：只注入一次，卸载时移除。 */
function installStyles() {
  if (typeof document === 'undefined') return () => {}
  const id = 'dsh-qibi-styles'
  if (!document.getElementById(id)) {
    const element = document.createElement('style')
    element.id = id
    element.textContent = STYLES
    document.head.appendChild(element)
  }
  return () => {
    const element = document.getElementById(id)
    if (element) element.remove()
  }
}

/** 浏览器半边依赖的宿主服务。 */
export const inject = ['slots', 'locale', 'layout']

/** 供 scripts/render-check.mjs 做真实渲染自检。 */
export { AiDrawer, DataSettings, OutlineTab, CharactersTab, ContinuityTab, DistillTab, Dialog, Workbench, NovelSettingsFields }

/**
 * 注册左侧栏图标与中央写作台。
 * @param {import('@deepseek-ai/cordis').Context} ctx 浏览器端根上下文。
 */
export function apply(ctx) {
  // 客户端贡献失败不应该让整页白屏：吞掉异常并留一条可诊断的日志。
  try {
    ctx.effect(() => ctx.locale.register(NS, dictionaries), 'qibi: dictionaries')
    const t = ctx.locale.bind(NS)
    ctx.effect(installStyles, 'qibi: styles')

    const call = (endpoint, payload, options) => callHost(endpoint, payload, options)

    ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({
      name: 'main',
      key: PANEL_ID,
      locale: NS,
      inject: () => ({ call, t }),
    }, ThemedWorkbench)), 'qibi: main panel')

    ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
      name: 'sidebar.panellist',
      id: PANEL_ID,
      order: 20,
      label: () => t('panel'),
      locale: NS,
    }, QibiIcon)), 'qibi: sidebar entry')
  } catch (error) {
    console.error('[qibi] 浏览器端注册失败：', error)
  }
}

function pick(row) {
  const form = {}
  for (const key of CHARACTER_FIELDS) form[key] = row?.[key] ?? ''
  return form
}
