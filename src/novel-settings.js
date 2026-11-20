export const NOVEL_FIELDS = ['title', 'author', 'genre', 'status', 'intro']
export const NOVEL_GENRES = ['玄幻', '奇幻', '仙侠', '都市', '科幻', '悬疑', '历史', '现实', '言情', '其他']
export const NOVEL_STATUSES = ['连载中', '已完本', '暂停更新']

export function novelForm(novel = {}) {
  return Object.fromEntries(NOVEL_FIELDS.map(key => [key, typeof novel[key] === 'string' ? novel[key] : '']))
}

export function novelFormDirty(form, initial) {
  const before = novelForm(initial), after = novelForm(form)
  return NOVEL_FIELDS.some(key => before[key] !== after[key])
}

export function novelPayload(form, initial) {
  const value = novelForm(form)
  const payload = { ...value, title: value.title.trim() }
  if (initial == null) return payload
  const before = novelForm(initial)
  return Object.fromEntries(Object.entries(payload).filter(([key]) => value[key] !== before[key]))
}
