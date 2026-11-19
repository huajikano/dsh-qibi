/** Keep the confirmed profile id/token if the separate ledger write needs a retry. */
export async function saveCharacterEditor({ call, novelId, dialog, onProgress }) {
  if (dialog.loadingState || dialog.stateLoadError) throw new Error('人物账本尚未成功读取，请先重试读取后再保存。')
  if (!dialog.form.name.trim()) throw new Error('人物名不能为空。')
  let current = { ...dialog }
  let saved
  if (current.id == null) {
    const payload = { novelId }
    for (const [key, value] of Object.entries(current.form)) if (value.trim()) payload[key] = value.trim()
    saved = await call('createCharacter', payload)
    current.id = saved.id
  } else {
    saved = await call('updateCharacter', { characterId: current.id, ...current.form, expectedToken: current.token ?? undefined })
  }
  current.token = saved.characters?.find(row => row.id === current.id)?.token ?? current.token
  onProgress(current)
  const fields = Object.fromEntries(Object.entries(current.state).filter(([, value]) => dialog.id != null || value.trim()))
  if (Object.keys(fields).length && (dialog.id == null || current.stateExists || Object.values(current.state).some(value => value.trim()))) {
    const state = await call('updateCharacterState', { characterId: current.id, ...fields, expectedToken: current.stateToken ?? undefined })
    current = { ...current, stateExists: true, stateToken: state.token ?? null }
    onProgress(current)
  }
  return current
}
