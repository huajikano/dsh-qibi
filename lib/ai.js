/**
 * 面板内 AI 生成。
 *
 * 走 DSH 自己的 `ctx.llm.stream()`，用当前默认模型（`agentDefaultModel`），
 * 因此不需要在插件里配置 Key，也不会读取起笔库里的加密密钥。
 *
 * 上下文按「作品 → 章节目录/摘要 → 细纲 → 人物 → 分卷 → 进度/伏笔 → 蒸馏 Skill → 前文」组装，
 * 全部做长度上限，避免把整本书塞进一次请求。
 */

/** 选区三件事：去 AI 味 / 润色 / 扩写。 */
export const SELECTION_MODES = {
  'deslop-selection': {
    label: '去AI味',
    prompt: '只输出这段选中文本按照 7 Gate 门禁系统去AI味精修后的替换内容，彻底清除套路词与工整腔调，不要解释、标题、引号或 Markdown 代码围栏；保持原剧情与人物口吻。',
    maxTokens: 3000,
  },
  'polish-selection': {
    label: '润色',
    prompt: '只输出这段选中文本的润色后替换内容，不要解释、标题、引号或 Markdown 代码围栏；保持原意、结构和人物口吻。',
    maxTokens: 3000,
  },
  'expand-selection': {
    label: '扩写',
    prompt: '只输出这段选中文本的扩写后替换内容，丰富细节、环境描写、心理活动或对话神态，不要解释、标题、引号或 Markdown 代码围栏；自然替换原段落。',
    maxTokens: 4000,
  },
}

/** 整章生成类动作。rewrite=true 表示输出整章，continue 表示只输出新增部分。 */
export const CHAPTER_MODES = {
  draft: {
    label: '细纲写章',
    prompt: '请深入结合全书已写各章节的前文剧情脉络与人物发展，紧扣本章细纲，创作本章完整正文。只输出正文，不要解释或标题。',
    rewrite: true,
    maxTokens: 8000,
  },
  continue: {
    label: '续写',
    prompt: '请紧密承接前文与本章已有正文，结合全书所有章节剧情与设定，自然续写（只需输出新增的续写内容）。',
    rewrite: false,
    maxTokens: 6000,
  },
  polish: {
    label: '润色全章',
    prompt: '请结合全书剧情与人物口吻，润色当前章节正文，输出润色后的完整全文。只输出正文，不要解释。',
    rewrite: true,
    maxTokens: 9000,
  },
  deslop: {
    label: '去AI味',
    prompt: '请严格执行 7 Gate 门禁系统，全面消除本章正文中的 AI 套路词与模板化痕迹，输出去AI味精修后的自然全文。只输出正文，不要解释。',
    rewrite: true,
    maxTokens: 9000,
  },
  expand: {
    label: '扩写全章',
    prompt: '请结合全书设定与前文伏笔，丰富细节与环境心理描写，扩写当前章节正文，输出扩写后的完整全文。只输出正文，不要解释。',
    rewrite: true,
    maxTokens: 9000,
  },
}

/** 分析类动作：只输出报告，不写正文。 */
export const REPORT_MODES = {
  review: {
    label: '审查',
    prompt: '请对当前章节进行资深主编与核心老读者双重视角的对抗式审查，给出毒点预警、结构节奏诊断与可执行修改示范。',
    maxTokens: 6000,
  },
  analyze: {
    label: '拆解',
    prompt: '请深度拆解当前文本的故事核、黄金三章抓人点、压抑与释放情绪曲线、金手指节奏与写作技巧。',
    maxTokens: 6000,
  },
  summary: {
    label: '摘要',
    prompt: '总结本章：用 200 字以内概括剧情，并列出关键事件与章末钩子。',
    maxTokens: 2000,
  },
  outline: {
    label: '后续细纲',
    prompt: '基于当前进度，为接下来的 3~5 章生成细纲建议，每章给出标题、核心事件与章末钩子。',
    maxTokens: 6000,
  },
  suggest: {
    label: '创作顾问',
    prompt: '以资深网文作者兼编辑的身份，基于以上全书设定、已写剧情与当前章节回答作者的创作问题，给出可执行的下一步建议。如果作者没有提出具体问题，就指出当前剧情最值得注意的三个问题与对应改法。只输出建议，不要写正文。',
    maxTokens: 4000,
    saveAsOutline: false,
  },
}

/** 截断工具。 */
function cut(text, max) {
  const value = typeof text === 'string' ? text : ''
  return value.length <= max ? value : `${value.slice(0, max)}…（已截断）`
}

/**
 * 组装一次生成的上下文。
 * @param {import('./store.js').QibiStore} store 数据层。
 * @param {{ novelId:number, chapterId:number|null }} input 目标作品与章节。
 */
export function buildContext(store, input) {
  const novelId = Number(input.novelId)
  const chapterId = input.chapterId == null ? null : Number(input.chapterId)
  const novels = store.novels()
  const novel = novels.find(row => row.id === novelId)
  if (!novel) throw new Error(`作品不存在：${novelId}`)
  const parts = []

  parts.push(`【作品】《${novel.title}》${novel.genre ? ` · ${novel.genre}` : ''}${novel.status ? ` · ${novel.status}` : ''}${novel.intro ? `\n简介：${cut(novel.intro, 800)}` : ''}`)

  const chapters = store.chapters(novelId)
  if (chapters.length) {
    const lines = []
    for (const chapter of chapters) {
      const bits = [`第${chapter.id}章《${chapter.title}》`, `${chapter.wordCount}字`]
      const summary = store.chapterSummary(chapter.id)
      if (summary.exists && summary.summary) bits.push(`摘要：${cut(summary.summary, 120)}`)
      lines.push(`- ${bits.join(' · ')}`)
    }
    parts.push(`【全书章节目录】\n${lines.join('\n')}`)
  }

  const outlines = store.outline(novelId)
  const masterOutline = outlines.filter(row => row.chapterId === null)
  if (masterOutline.length) {
    parts.push(`【作品总纲】\n${masterOutline.map(row => `${row.title ? `${row.title}\n` : ''}${cut(row.content, 2000)}`).join('\n---\n')}`)
  }
  const chapterOutline = chapterId == null ? null : outlines.find(row => row.chapterId === chapterId)
  if (chapterOutline) {
    parts.push(`【本章细纲】${chapterOutline.title ? `\n${chapterOutline.title}` : ''}\n${cut(chapterOutline.content, 3000)}`)
  } else if (chapterId != null) {
    parts.push('【本章细纲】这一章还没有填写细纲。请严格依据作品总纲、各章摘要、人物设定、创作进度与伏笔、前一章正文自然推进；不要引入没有铺垫的新设定、新人物或新能力，也不要提前使用后文才会揭示的信息。')
  }

  const characters = store.characters(novelId)
  if (characters.length) {
    const lines = characters.slice(0, 40).map(character => {
      const bits = [character.name]
      if (character.role) bits.push(character.role)
      if (character.alias) bits.push(`别名 ${character.alias}`)
      const detail = [
        character.gender ? `性别：${character.gender}` : '',
        character.personality ? `性格：${character.personality}` : '',
        character.appearance ? `外貌：${character.appearance}` : '',
        character.background ? `背景：${character.background}` : '',
        character.location ? `位置：${character.location}` : '',
        character.realm ? `境界：${character.realm}` : '',
      ].filter(Boolean).join('；')
      return `- ${bits.join(' · ')}${detail ? ` —— ${cut(detail, 240)}` : ''}`
    })
    parts.push(`【人物设定】\n${lines.join('\n')}`)
  }

  const volumes = store.volumes(novelId)
  if (volumes.length) {
    parts.push(`【分卷】\n${volumes.map(volume => `- ${volume.title}${volume.summary ? `：${cut(volume.summary, 300)}` : ''}`).join('\n')}`)
  }

  const writerState = store.writerState(novelId)
  if (writerState.exists) {
    const bits = []
    if (writerState.progress && writerState.progress.trim()) bits.push(`- 写作进度：${cut(writerState.progress.trim(), 1500)}`)
    if (writerState.foreshadowing && writerState.foreshadowing.trim() && writerState.foreshadowing !== '[]') {
      bits.push(`- 伏笔账本：${cut(writerState.foreshadowing.trim(), 2000)}`)
    }
    if (bits.length) parts.push(`【创作进度与伏笔】\n${bits.join('\n')}`)
  }

  const style = store.distilledStyleLine()
  if (style) parts.push(style)

  if (chapterId != null) {
    const index = chapters.findIndex(row => row.id === chapterId)
    const previous = index > 0 ? chapters[index - 1] : null
    if (previous) {
      const content = store.chapter(previous.id).content
      if (content.trim()) parts.push(`【前一章正文】第${previous.id}章《${previous.title}》\n${cut(content, 6000)}`)
    }
  }

  return parts.join('\n\n')
}

/**
 * 解析要用的模型：config 覆盖优先，否则用 DSH 当前默认模型。
 * @param {import('@deepseek-ai/cordis').Context} ctx 宿主上下文。
 * @param {Record<string, unknown>} config 插件 config。
 */
export function resolveModel(ctx, config) {
  const provider = typeof config.aiProvider === 'string' && config.aiProvider.trim() ? config.aiProvider.trim() : null
  const model = typeof config.aiModel === 'string' && config.aiModel.trim() ? config.aiModel.trim() : null
  if (provider && model) {
    return { provider, model, reasoningEffort: typeof config.aiReasoningEffort === 'string' ? config.aiReasoningEffort : undefined }
  }
  const defaults = ctx.get('agentDefaultModel')
  if (defaults && typeof defaults.currentSelection === 'function') {
    const current = defaults.currentSelection()
    if (current?.provider && current?.model) return current
  }
  return null
}

/** Read exact adapter-owned reasoning metadata without making a generation request. */
export async function getReasoningInfo(llm, selection, signal) {
  const base = {
    known: false,
    supported: false,
    efforts: [],
    selectedEffort: typeof selection?.reasoningEffort === 'string' ? selection.reasoningEffort : null,
    defaultEffort: null,
  }
  if (!selection || typeof llm?.resolveModelInfo !== 'function') return base
  try {
    const model = await llm.resolveModelInfo(selection.provider, selection.model, signal)
    const seen = new Set()
    const efforts = []
    for (const row of model.reasoning?.efforts ?? []) {
      if (typeof row?.id !== 'string' || !row.id || seen.has(row.id)) continue
      seen.add(row.id)
      const effort = { id: row.id, name: typeof row.name === 'string' && row.name ? row.name : row.id }
      if (typeof row.description === 'string') effort.description = row.description
      efforts.push(effort)
    }
    return {
      ...base,
      known: true,
      supported: efforts.length > 0,
      efforts,
      defaultEffort: typeof model.reasoning?.defaultEffort === 'string' ? model.reasoning.defaultEffort : null,
    }
  } catch (error) {
    if (signal?.aborted) throw error
    // A missing capability lookup must not disable the pre-existing default generation path.
    return base
  }
}

/**
 * 流式生成一段文本。
 * @param {object} input
 * @param {{ provider:string, model:string, reasoningEffort?:string }} input.selection 模型选择。
 * @param {object} input.llm 宿主 llm 服务。
 * @param {string} input.system 系统提示。
 * @param {string} input.prompt 用户提示。
 * @param {number} [input.maxTokens] 输出上限。
 * @param {AbortSignal} [input.signal] 取消信号。
 */
export async function* streamText({ selection, llm, system, prompt, maxTokens, signal, requireStop = false }) {
  const options = {
    provider: selection.provider,
    model: selection.model,
    system,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
    maxTokens,
    signal,
  }
  if (selection.reasoningEffort) options.reasoningEffort = selection.reasoningEffort
  for await (const chunk of llm.stream(options)) {
    if (chunk.type === 'text-delta') {
      if (chunk.text) yield chunk.text
      continue
    }
    if (chunk.type === 'finish') {
      const reason = chunk.reason
      if (reason?.kind === 'max-tokens') {
        // 输出被长度上限截断：不能当成正常完成，否则半截正文会被写回章节。
        const error = new Error('模型输出达到长度上限，内容没有写完。')
        error.code = 'MAX_TOKENS'
        throw error
      }
      if (reason?.kind === 'error' || reason?.kind === 'aborted') {
        const failure = reason.failure ?? {}
        const error = new Error(failure.message || (reason.kind === 'aborted' ? '生成已取消' : '模型调用失败'))
        error.code = failure.code || (reason.kind === 'aborted' ? 'ABORTED' : 'LLM_ERROR')
        throw error
      }
      if (requireStop && reason?.kind !== 'stop') {
        const error = new Error('模型未正常结束，不能保存连续性资料。')
        error.code = 'INCOMPLETE_STREAM'
        throw error
      }
      return
    }
  }
  const error = new Error('模型响应未完整结束，请重新生成；当前内容仅可预览。')
  error.code = 'INCOMPLETE_STREAM'
  throw error
}

/** 按动作组装 system 与 user 提示。 */
export function buildPrompts({ mode, context, content, extra }) {
  const selectionMode = SELECTION_MODES[mode]
  const chapterMode = CHAPTER_MODES[mode]
  const reportMode = REPORT_MODES[mode]

  if (selectionMode) {
    const user = [
      selectionMode.prompt,
      extra ? `\n【补充要求】\n${cut(extra, 2000)}` : '',
      `\n【作品与剧情上下文】\n${context}`,
      `\n【选中文本】\n${content}`,
    ].join('\n')
    return {
      system: '你是严谨的中文小说编辑助手，只输出可直接替换原文的正文，不解释、不加标题或代码围栏。',
      prompt: user,
      maxTokens: selectionMode.maxTokens,
      rewrite: false,
    }
  }

  if (chapterMode) {
    const user = [
      chapterMode.prompt,
      extra ? `\n【补充要求】\n${cut(extra, 2000)}` : '',
      `\n【作品与剧情上下文】\n${context}`,
      `\n【当前章节正文】\n${cut(content || '（本章还没有正文）', 12000)}`,
    ].join('\n')
    return {
      system: '你是资深中文网络小说写手，严格遵循提供的设定、人物与既有文风；只输出正文。',
      prompt: user,
      maxTokens: chapterMode.maxTokens,
      rewrite: chapterMode.rewrite,
    }
  }

  if (reportMode) {
    const user = [
      reportMode.prompt,
      extra ? `\n【补充要求】\n${cut(extra, 2000)}` : '',
      `\n【作品与剧情上下文】\n${context}`,
      `\n【当前章节正文】\n${cut(content || '（本章还没有正文）', 12000)}`,
    ].join('\n')
    return {
      system: '你是资深小说编辑与写作教练，输出结构清晰的分析报告，假设作者是内行。',
      prompt: user,
      maxTokens: reportMode.maxTokens,
      rewrite: false,
      report: true,
    }
  }

  throw new Error(`未知的 AI 模式：${String(mode)}`)
}

/** 可供面板展示的模式清单。 */
export function listModes() {
  const rows = []
  for (const [id, item] of Object.entries(SELECTION_MODES)) rows.push({ id, label: item.label, group: 'selection' })
  for (const [id, item] of Object.entries(CHAPTER_MODES)) rows.push({ id, label: item.label, group: 'chapter', rewrite: item.rewrite })
  for (const [id, item] of Object.entries(REPORT_MODES)) {
    rows.push({ id, label: item.label, group: 'report', saveAsOutline: item.saveAsOutline !== false })
  }
  return rows
}
