/** Serialize all saves, including forced saves, around the latest draft snapshot. */
export async function runSerializedSave(inFlight, force, perform) {
  while (inFlight.current) {
    const previous = await inFlight.current.catch(() => false)
    if (!previous && !force) return false
  }
  // Publish the lock before perform can execute or synchronously re-enter save.
  const task = Promise.resolve().then(perform)
  inFlight.current = task
  try { return await task }
  finally { if (inFlight.current === task) inFlight.current = null }
}

/** Navigation succeeds only after the last keystroke, not merely one successful request. */
export async function flushDraft({ isCurrent, isDirty, isSaving, save }) {
  while (isDirty() || isSaving()) {
    if (!isCurrent() || !(await save())) return false
  }
  return isCurrent()
}
