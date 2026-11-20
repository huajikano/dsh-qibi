/** Lossless schema boundary for the JSON-string foreshadowing ledger.
 * Parsing never normalizes the caller's raw text. Mutations return that same
 * string when disabled, unsupported, out of bounds, or unchanged.
 */
const own = (value, key) => Object.hasOwn(value, key)
const titleKeys = ['title', 'name']
const detailKeys = ['detail', 'content', 'description']
let idSequence = 0

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `foreshadow-${Date.now().toString(36)}-${(++idSequence).toString(36)}-${Math.random().toString(36).slice(2)}`
}

// JSON.parse can silently round unknown numeric metadata. Keep such ledgers in
// raw mode instead of serializing already-rounded values during an unrelated edit.
function normalizedNumber(token) {
  const match = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(token)
  let digits = `${match[2]}${match[3] ?? ''}`.replace(/^0+/, '')
  if (!digits) return match[1] ? '-0' : '0'
  let exponent = Number(match[4] ?? 0) - (match[3]?.length ?? 0)
  const trailing = /0+$/.exec(digits)?.[0].length ?? 0
  digits = digits.slice(0, digits.length - trailing)
  exponent += trailing
  return `${match[1]}${digits}e${exponent}`
}

function hasLossyNumbers(raw) {
  const tokens = /"(?:\\.|[^"\\])*"|(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/g
  for (const token of raw.matchAll(tokens)) {
    if (!token[1]) continue
    const number = Number(token[1])
    if (!Number.isFinite(number) || normalizedNumber(token[1]) !== normalizedNumber(JSON.stringify(number))) return true
  }
  return false
}

function hasDuplicateKeys(raw) {
  const stack = []
  // Called only after JSON.parse validates syntax. Strings are consumed whole,
  // including escaped object keys, so punctuation inside prose is ignored.
  for (const [token] of raw.matchAll(/"(?:\\.|[^"\\])*"|[{}[\],:]/g)) {
    if (token === '{') stack.push({ keys: new Set(), expectingKey: true })
    else if (token === '[') stack.push(null)
    else if (token === '}' || token === ']') stack.pop()
    else {
      const frame = stack[stack.length - 1]
      if (!frame) continue
      if (token === ',') frame.expectingKey = true
      else if (token.startsWith('"') && frame.expectingKey) {
        const key = JSON.parse(token)
        if (frame.keys.has(key)) return true
        frame.keys.add(key)
        frame.expectingKey = false
      }
    }
  }
  return false
}

function describeEntry(value) {
  if (typeof value === 'string') return { kind: 'string', text: value }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const titles = titleKeys.filter(key => own(value, key))
  const details = detailKeys.filter(key => own(value, key))
  if (titles.length > 1 || details.length > 1 || (!titles.length && !details.length)) return null
  for (const key of [...titles, ...details, 'notes']) {
    if (own(value, key) && typeof value[key] !== 'string') return null
  }
  if (own(value, 'status') && own(value, 'open')) return null
  if (own(value, 'status') && typeof value.status !== 'string') return null
  if (own(value, 'open') && typeof value.open !== 'boolean') return null
  const fields = {
    title: titles[0] ?? 'title',
    detail: details[0] ?? 'detail',
    notes: 'notes',
    status: own(value, 'open') ? 'open' : 'status',
  }
  return {
    kind: 'object',
    fields,
    title: value[fields.title] ?? '',
    detail: value[fields.detail] ?? '',
    notes: value.notes ?? '',
    status: fields.status === 'open' ? (value.open ? 'open' : 'resolved') : (value.status ?? 'open'),
    id: value.id,
  }
}

/** @returns {{raw:string, valid:boolean, editable:boolean, entries:Array, reason:string|null, error:string|null, data?:Array}} */
export function parseForeshadowing(value = '[]') {
  const raw = value ?? '[]'
  if (typeof raw !== 'string') return { raw, valid: false, editable: false, entries: [], reason: 'invalid', error: 'Expected a JSON string' }
  let data
  try { data = JSON.parse(raw) } catch (cause) {
    return { raw, valid: false, editable: false, entries: [], reason: 'invalid', error: String(cause.message ?? cause) }
  }
  const base = { raw, valid: true, editable: false, entries: [], reason: 'schema', error: null }
  if (!Array.isArray(data)) return base
  if (hasLossyNumbers(raw)) return { ...base, reason: 'numbers' }
  if (hasDuplicateKeys(raw)) return { ...base, reason: 'duplicates' }
  const entries = data.map(describeEntry)
  if (entries.some(entry => !entry)) return base
  return { ...base, editable: true, entries, data, reason: null }
}

export function addForeshadowing(value, { disabled = false } = {}) {
  const parsed = parseForeshadowing(value)
  if (disabled || !parsed.editable) return parsed.raw
  return JSON.stringify([...parsed.data, { id: newId(), title: '', detail: '', status: 'open', notes: '' }], null, 2)
}

export function updateForeshadowing(value, index, patch, { disabled = false } = {}) {
  const parsed = parseForeshadowing(value)
  if (disabled || !parsed.editable || !Number.isInteger(index) || index < 0 || index >= parsed.entries.length || !patch || typeof patch !== 'object') return parsed.raw
  const entry = parsed.entries[index]
  let next = parsed.data[index]
  if (entry.kind === 'string') {
    if (typeof patch.text !== 'string' || patch.text === next) return parsed.raw
    next = patch.text
  } else {
    next = { ...next }
    let changed = false
    for (const field of ['title', 'detail', 'notes', 'status']) {
      if (!own(patch, field) || typeof patch[field] !== 'string') continue
      // Existing unknown statuses remain visible and intact; UI writes only the
      // two documented transitions when the author explicitly selects one.
      if (field === 'status' && !['open', 'resolved'].includes(patch[field])) continue
      const key = entry.fields[field]
      const candidate = key === 'open' ? patch[field] === 'open' : patch[field]
      if (candidate === (key === 'open' ? next.open : entry[field])) continue
      next[key] = candidate
      changed = true
    }
    if (!changed) return parsed.raw
  }
  const rows = [...parsed.data]
  rows[index] = next
  return JSON.stringify(rows, null, 2)
}

export function removeForeshadowing(value, index, { disabled = false } = {}) {
  const parsed = parseForeshadowing(value)
  if (disabled || !parsed.editable || !Number.isInteger(index) || index < 0 || index >= parsed.entries.length) return parsed.raw
  return JSON.stringify(parsed.data.filter((_, position) => position !== index), null, 2)
}

const clueKey = text => typeof text === 'string' ? text.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase() : ''

/** Keep legacy fields intact; match prior titles and evidence from the same chapter. */
export function appendContinuityForeshadows(raw, candidates, chapter) {
  if (!candidates.length) return { raw, added: 0, skipped: false }
  const parsed = parseForeshadowing(raw)
  if (!parsed.editable) return { raw, added: 0, skipped: true }
  const titles = new Set(parsed.entries.map(entry => clueKey(entry.kind === 'string' ? entry.text : entry.title)))
  const evidence = new Set(parsed.data.filter(entry => entry?.sourceChapterId === chapter.id).map(entry => clueKey(entry.evidence)))
  const entries = []
  for (const row of candidates) {
    const title = clueKey(row.title)
    const quote = clueKey(row.evidence)
    if (!title || !quote || titles.has(title) || evidence.has(quote) || !chapter.content.includes(row.evidence)) continue
    entries.push({ id: newId(), title: row.title, detail: row.detail, status: 'open', notes: row.evidence, evidence: row.evidence, sourceChapterId: chapter.id })
    titles.add(title)
    evidence.add(quote)
  }
  return { raw: entries.length ? JSON.stringify([...parsed.data, ...entries], null, 2) : raw, added: entries.length, skipped: false }
}
