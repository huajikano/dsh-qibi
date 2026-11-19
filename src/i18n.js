/**
 * 面板文案：复用插件 locale/*.json 的 `ui` 段，避免同一句文案写两遍。
 * 语言缺失时由宿主的回退链处理（DSH 默认回退到 en）。
 */

import en from '../locale/en.json'
import zh from '../locale/zh.json'

/** 语言命名空间（与注册时同名）。 */
export const NS = 'qibi'

/** 扁平字典：`{ key: '文案' }`。 */
function flat(pack) {
  const ui = pack && typeof pack.ui === 'object' && pack.ui !== null ? pack.ui : {}
  return Object.fromEntries(Object.entries(ui).map(([key, value]) => [key, String(value)]))
}

export const dictionaries = { zh: flat(zh), en: flat(en) }
