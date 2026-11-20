import { createHash } from 'node:crypto'
import { generateContinuityDraft } from './continuity-ai.js'

const MAX_COMPLETED = 256
const MODEL_TIMEOUT_MS = 120_000

export function createContinuityOrganizer({ store, resolveRuntime, ErrorType }) {
  const lifetime = new AbortController()
  const completed = new Map()
  let active = false

  return {
    dispose() {
      lifetime.abort()
      completed.clear()
    },
    async organize(input, requestSignal) {
      if (lifetime.signal.aborted || requestSignal?.aborted) throw new ErrorType('ABORTED', '连续性整理已取消。')
      if (active) throw new ErrorType('CONTINUITY_BUSY', '已有连续性整理正在运行，请等待完成后重试。')
      const snapshot = store.continuitySnapshot(input)
      const { chapter, userId } = snapshot
      const key = `${userId}:${chapter.novelId}:${chapter.id}`
      // Status and metadata saves can change the optimistic lock without changing the prose.
      const digest = createHash('sha256').update(chapter.content).digest('hex')
      const noteKey = state => JSON.stringify([state.summary.exists, state.summary.token, state.writerState.exists, state.writerState.token])
      const prior = completed.get(key)
      if (prior?.digest === digest && prior.notes === noteKey(snapshot)) {
        return { filled: 0, foreshadowAdded: 0, ledgerSkipped: prior.ledgerSkipped, alreadyOrganized: true }
      }
      const timeout = AbortSignal.timeout(MODEL_TIMEOUT_MS)
      const signal = AbortSignal.any([lifetime.signal, timeout, ...(requestSignal ? [requestSignal] : [])])
      active = true
      try {
        const runtime = await resolveRuntime(input, signal)
        let draft
        try {
          draft = await generateContinuityDraft({ chapter, ...runtime, signal })
        } catch (error) {
          throw new ErrorType(error.code || 'LLM_ERROR', error.message || '模型未能整理本章。')
        }
        signal.throwIfAborted()
        const result = store.saveContinuityDraft(snapshot, draft)
        completed.delete(key)
        const committed = store.continuitySnapshot(input)
        completed.set(key, { digest, notes: noteKey(committed), ledgerSkipped: result.ledgerSkipped })
        if (completed.size > MAX_COMPLETED) completed.delete(completed.keys().next().value)
        return result
      } catch (error) {
        if (signal.aborted) {
          if (timeout.aborted && signal.reason === timeout.reason) throw new ErrorType('CONTINUITY_TIMEOUT', '整理超时，未写入资料。请稍后重试。')
          throw new ErrorType('ABORTED', '连续性整理已取消。')
        }
        throw error
      } finally {
        active = false
      }
    },
  }
}
