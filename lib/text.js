/**
 * 起笔写入约定所需的文本工具。
 *
 * `countChineseChars` 与 `splitChunks` 是起笔 `server/src/db.ts`、`server/src/kb.ts`
 * 的逐字复刻：字数必须与起笔显示的一致，知识库切块必须与起笔检索器一致。
 */

/** 与起笔 `countChineseChars` 完全一致：CJK 按字计，其余字符逐字计。 */
export function countChineseChars(text) {
  const value = typeof text === 'string' ? text : ''
  const cjk = value.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g)
  const other = value.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, '').length
  return (cjk ? cjk.length : 0) + other
}

/** 与起笔 `splitChunks` 一致：按段落聚合到不超过 maxLen 的块。 */
export function splitChunks(text, maxLen = 480) {
  if (!text) return []
  const out = []
  const paragraphs = text.split(/\r?\n/)
  let buf = ''
  for (const p of paragraphs) {
    if (!p.trim()) continue
    if ((buf + '\n' + p).length > maxLen && buf) {
      out.push(buf)
      buf = p
    } else {
      buf = buf ? buf + '\n' + p : p
    }
  }
  if (buf) out.push(buf)
  return out
}

/** 与起笔 `kb.ts` 的 `tokenize` 一致：ASCII 单词 + 单字 + 二/三元滑窗。 */
export function tokenize(text) {
  if (!text) return []
  const norm = String(text).toLowerCase().replace(/[\r\n]+/g, ' ')
  const tokens = []
  const re = /[a-z0-9]+|[\u4e00-\u9fff]/gi
  let m
  const chars = []
  while ((m = re.exec(norm))) {
    if (m[0].length > 1) tokens.push(m[0])
    else chars.push(m[0])
  }
  for (let i = 0; i < chars.length; i++) {
    tokens.push(chars[i])
    if (i + 1 < chars.length) tokens.push(chars[i] + chars[i + 1])
    if (i + 2 < chars.length) tokens.push(chars[i] + chars[i + 1] + chars[i + 2])
  }
  return tokens
}

/** 有界摘要：明确标注截断，供工具返回使用。 */
export function truncate(text, max) {
  const value = typeof text === 'string' ? text : ''
  if (!Number.isFinite(max) || value.length <= max) return { text: value, truncated: false }
  return { text: value.slice(0, Math.max(0, max)), truncated: true }
}
