import { useEffect, useRef, useState } from 'react'

const PREF_PREFIX = 'qibi:continuity-auto:v1:'

function preferenceKey(scope, novelId) {
  return scope && novelId != null ? PREF_PREFIX + JSON.stringify([scope.dbPath, scope.userId, novelId]) : null
}

function readPreference(key) {
  try { return key != null && globalThis.localStorage?.getItem(key) === '1' }
  catch { return false }
}

export function useContinuityJobs({ call, status, novelId, writable, notify, t }) {
  const dbPath = status?.dbPath
  const userId = status?.user?.id
  const scopeKey = typeof dbPath === 'string' && dbPath && Number.isSafeInteger(userId) ? JSON.stringify([dbPath, userId]) : null
  const scope = scopeKey ? { dbPath, userId } : null
  const autoKey = preferenceKey(scope, novelId)
  const latest = useRef(null)
  const queue = useRef([])
  const running = useRef(null)
  const alive = useRef(true)
  const preferences = useRef(new Map())
  const [enabledOverride, setEnabledOverride] = useState(null)
  const [state, setState] = useState({ task: null, revision: 0 })
  latest.current = { call, scope, scopeKey, novelId, writable, notify, t }

  function autoEnabled(targetScope, targetNovelId) {
    const key = preferenceKey(targetScope, targetNovelId)
    return key !== null && (preferences.current.get(key) ?? readPreference(key))
  }

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      queue.current = []
      const job = running.current
      running.current = null
      job?.controller.abort()
    }
  }, [])

  useEffect(() => {
    queue.current = queue.current.filter(job => job.scopeKey === scopeKey)
    const job = running.current
    if (job && job.scopeKey !== scopeKey) job.controller.abort()
  }, [scopeKey])

  useEffect(() => {
    if (writable) return
    queue.current = []
    running.current?.controller.abort()
  }, [writable])

  function setAuto(next) {
    const current = latest.current
    const key = preferenceKey(current.scope, current.novelId)
    if (!key || (next && !current.writable) || autoEnabled(current.scope, current.novelId) === next) return
    if (next && !window.confirm(current.t('continuityOrganizerAutoConfirm'))) return
    preferences.current.set(key, next)
    setEnabledOverride({ key, enabled: next })
    try {
      if (!globalThis.localStorage) throw new Error('Storage unavailable')
      globalThis.localStorage.setItem(key, next ? '1' : '0')
    } catch { current.notify('info', current.t('continuityOrganizerPreferenceNotSaved')) }
    if (!next) {
      queue.current = queue.current.filter(job => !job.automatic || job.autoKey !== key)
      const job = running.current
      if (job?.automatic && job.autoKey === key) job.controller.abort()
    }
  }

  function pump() {
    if (!alive.current || running.current) return
    const current = latest.current
    while (queue.current.length) {
      const next = queue.current.shift()
      if (!current.writable || next.scopeKey !== current.scopeKey) continue
      if (next.automatic && !autoEnabled(current.scope, next.novelId)) continue
      const job = { ...next, controller: new AbortController() }
      running.current = job
      const task = { phase: 'running', scopeKey: job.scopeKey, novelId: job.novelId, chapterId: job.chapterId, title: job.title }
      setState(previous => ({ ...previous, task }))
      const isCurrent = () => alive.current && running.current === job && latest.current.scopeKey === job.scopeKey
      void (async () => {
        try {
          const result = await current.call('organizeContinuity', job.payload, { signal: job.controller.signal })
          if (!isCurrent()) return
          setState(previous => ({ revision: previous.revision + (result.filled || result.foreshadowAdded ? 1 : 0), task: { ...task, phase: 'done', result } }))
          if (job.automatic) latest.current.notify('info', latest.current.t('continuityOrganizerDone') + ' · ' + job.title)
        } catch (error) {
          if (!isCurrent()) return
          const cancelled = job.controller.signal.aborted || error?.code === 'ABORTED'
          setState(previous => ({ ...previous, task: { ...task, phase: cancelled ? 'cancelled' : 'error', message: cancelled ? undefined : String(error?.message ?? error) } }))
          if (job.automatic && !cancelled) latest.current.notify('error', `${latest.current.t('continuityOrganizerError')} · ${job.title}：${error?.message ?? error}`)
        } finally {
          if (running.current === job) {
            running.current = null
            pump()
          }
        }
      })()
      return
    }
  }

  function enqueue(chapter, automatic = false, expectedScope = latest.current.scopeKey) {
    const current = latest.current
    if (!alive.current || !current.scope || current.scopeKey !== expectedScope || !current.writable || !chapter?.content?.trim() || !chapter.token) return
    if (!automatic && (running.current || chapter.novelId !== current.novelId)) return
    if (automatic && (chapter.status !== '已发布' || !autoEnabled(current.scope, chapter.novelId))) return
    const key = JSON.stringify([current.scopeKey, chapter.novelId, chapter.id, chapter.token])
    if (running.current?.key === key || queue.current.some(job => job.key === key)) return
    queue.current.push({
      key, scopeKey: current.scopeKey, automatic, autoKey: preferenceKey(current.scope, chapter.novelId),
      novelId: chapter.novelId, chapterId: chapter.id, title: chapter.title,
      payload: { novelId: chapter.novelId, chapterId: chapter.id, expectedChapterToken: chapter.token, scope: current.scope, requirePublished: automatic },
    })
    pump()
  }

  const task = state.task?.scopeKey === scopeKey && (state.task.phase === 'running' || state.task.novelId === novelId) ? state.task : null
  return {
    scopeKey, task, refreshVersion: state.revision,
    enabled: enabledOverride?.key === autoKey ? enabledOverride.enabled : autoEnabled(scope, novelId),
    setAuto, enqueue,
    cancel: () => { if (running.current?.scopeKey === latest.current.scopeKey) running.current.controller.abort() },
  }
}
