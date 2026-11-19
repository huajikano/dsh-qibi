export const CHARACTER_FIELDS = ['name', 'alias', 'role', 'gender', 'age', 'appearance', 'personality', 'background']
export const CHARACTER_IMPORT_LIMIT = 30
export const characterNameKey = name => typeof name === 'string' ? name.trim().normalize('NFKC').toLowerCase() : ''

export function candidateFields(candidate) {
  return Object.fromEntries(CHARACTER_FIELDS.map(field => [field, typeof candidate?.[field] === 'string' ? candidate[field] : '']))
}

/** The first name identifies the card even if the author later renames it. */
export function mergeCharacterCandidates(previous, incoming, existingNames, importedKeys) {
  const rows = [...previous]
  const origins = new Map(rows.map((row, index) => [row.origin, index]))
  const editedNames = new Map()
  let selected = 0
  for (const [index, row] of rows.entries()) {
    const key = characterNameKey(row.fields.name)
    if (key && !editedNames.has(key)) editedNames.set(key, index)
    if (row.selected) selected++
  }
  for (const candidate of incoming) {
    const fields = candidateFields(candidate)
    const key = characterNameKey(fields.name)
    if (!key || importedKeys.has(key)) continue
    const index = origins.get(key) ?? editedNames.get(key)
    if (index !== undefined) {
      const row = rows[index]
      const additions = CHARACTER_FIELDS.filter(field => field !== 'name' && !row.edited[field] && !row.fields[field].trim() && fields[field].trim())
      if (additions.length) rows[index] = { ...row, fields: { ...row.fields, ...Object.fromEntries(additions.map(field => [field, fields[field]])) } }
      continue
    }
    const checked = selected < CHARACTER_IMPORT_LIMIT && !existingNames.has(key)
    if (checked) selected++
    origins.set(key, rows.length)
    rows.push({ origin: key, fields, edited: {}, selected: checked })
  }
  return rows
}

/** An invalid response must leave both preview and cursor untouched. */
export function validRangeSource(source, requested, availableChapters) {
  if (source?.scope !== 'range' || source.availableChapters !== availableChapters ||
    !Number.isSafeInteger(source.analyzedChapters) || source.analyzedChapters < 1 || source.analyzedChapters > 15 ||
    typeof source.done !== 'boolean' || source.truncated !== !source.done) return false
  if (source.done) return source.nextCursor === null
  const base = requested ?? { chapterIndex: 0, offset: 0 }
  const next = source.nextCursor
  return Boolean(next && Number.isSafeInteger(next.chapterIndex) && next.chapterIndex >= base.chapterIndex && next.chapterIndex < availableChapters &&
    Number.isSafeInteger(next.offset) && next.offset >= 0 && (next.chapterIndex > base.chapterIndex || next.offset > base.offset))
}
