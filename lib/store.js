/**
 * 起笔数据库的读写层。
 *
 * 设计约束（见 docs/DETAIL.md）：
 * - 只碰内容表，绝不读取 `users.*_api_key_enc`。
 * - 新目录仅初始化一份无书稿的空库；既有库不执行 DDL，缺少可选列时降级。
 * - 写正文严格复刻起笔的约定：`word_count = countChineseChars(content)`、
 *   `updated_at = datetime('now')`、`touchNovel` 重算作品总字数、写前备份到 chapter_revisions、
 *   写完重建该章的 kb_chunks（否则起笔自带检索看不到新正文）。
 * - 覆盖写入用 `updated_at` 乐观锁，冲突时抛 QibiError('CHAPTER_CONFLICT')，绝不静默覆盖。
 */

import { DatabaseSync } from 'node:sqlite'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { countChineseChars, splitChunks, tokenize } from './text.js'
import { parseSourceFile } from './parser.js'
import { ensureEmptyDatabase } from './database.js'

const DISTILL_FORMATS = new Set(['txt', 'epub', 'md', 'html', 'htm', 'json'])
const DISTILL_MAX_SOURCE_BYTES = 100 * 1024 * 1024

/**
 * 章节内容令牌：覆盖写用的强乐观锁。
 *
 * 起笔的 `updated_at` 只有秒级精度，同一秒内两次写入会得到相同时间戳，
 * 单靠时间戳无法发现并发覆盖（自检时真实踩到过）。这里把时间戳与正文一起哈希，
 * 内容或时间任一变化都会换令牌。
 * @param {string} updatedAt 数据库里的 updated_at。
 * @param {string} content 正文。
 * @returns {string} 16 位十六进制令牌。
 */
export function chapterToken(updatedAt, content) {
  return crypto.createHash('sha256').update(`${updatedAt}\u0000${content}`).digest('hex').slice(0, 16)
}

/**
 * 资料类实体（大纲/人物/分卷/摘要/写作状态）的乐观锁令牌。
 * 时间戳只有秒级精度，因此把关键字段一起哈希；读取时下发给面板与 Agent，写入时校验。
 */
export function entityToken(updatedAt, parts) {
  const body = parts.map(part => (part == null ? '' : String(part))).join('\u0000')
  return crypto.createHash('sha256').update(`${updatedAt ?? ''}\u0000${body}`).digest('hex').slice(0, 16)
}

/** 插件对外错误：code 稳定，message 面向人，details 供 UI 判断。 */
export class QibiError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'QibiError'
    this.code = code
    this.details = details
  }
}

/** Independent plugin storage; the legacy desktop database is only opened when explicitly chosen. */
export function defaultDataDir({ platform = process.platform, env = process.env, home = os.homedir(), hasDrive = fs.existsSync } = {}) {
  if (platform === 'win32') {
    if (hasDrive('D:\\')) return 'D:\\dsh-qibi\\data'
    const appData = env.APPDATA ?? path.win32.join(home, 'AppData', 'Roaming')
    return path.win32.join(appData, 'dsh-qibi', 'data')
  }
  if (platform === 'darwin') {
    return path.posix.join(home, 'Library', 'Application Support', 'dsh-qibi', 'data')
  }
  return path.posix.join(env.XDG_DATA_HOME ?? path.posix.join(home, '.local', 'share'), 'dsh-qibi', 'data')
}

/**
 * 解析数据目录：显式 config > 环境变量 > 平台默认。
 * @param {Record<string, unknown>} config 插件 config。
 * @returns {string} 绝对路径。
 */
export function resolveDataDir(config = {}, defaultDirectory = defaultDataDir) {
  const configured = typeof config.dataDir === 'string' ? config.dataDir.trim() : ''
  if (configured) return path.resolve(configured)
  const env = typeof process.env.QIBI_DATA_DIR === 'string' ? process.env.QIBI_DATA_DIR.trim() : ''
  if (env) return path.resolve(env)
  return defaultDirectory()
}

/** 章节状态里起笔使用的中文取值，仅用于展示兜底，不参与校验。 */
const CHAPTER_STATUSES = ['草稿', '已发布']

/** 蒸馏作者 slug：中文保留，其余字符折叠为连字符。 */
function slugifyAuthor(value) {
  const slug = String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '-').replace(/^-+|-+$/g, '')
  return slug || `author-${crypto.randomBytes(4).toString('hex')}`
}

/** profile 字段容错解析。 */
function parseProfile(value) {
  try {
    return value ? JSON.parse(value) : {}
  } catch {
    return {}
  }
}

/** 版本行 → 面板/工具可读对象。 */
function publicDistillVersion(row) {
  return {
    id: Number(row.id),
    authorId: Number(row.author_id),
    version: Number(row.version),
    writingSkill: String(row.writing_skill ?? ''),
    authorPersona: String(row.author_persona ?? ''),
    skillMarkdown: String(row.skill_markdown ?? ''),
    sampleSummary: String(row.sample_summary ?? ''),
    createdAt: String(row.created_at ?? ''),
  }
}

/** 素材行 → 面板/工具可读对象（不暴露物理路径）。 */
function publicDistillSource(row) {
  return {
    id: Number(row.id),
    authorId: Number(row.author_id),
    kind: String(row.kind ?? 'novel'),
    filename: String(row.filename ?? ''),
    format: String(row.format ?? ''),
    sizeBytes: Number(row.size_bytes ?? 0),
    parsedChars: Number(row.parsed_chars ?? 0),
    chapterCount: Number(row.chapter_count ?? 0),
    status: String(row.status ?? ''),
    error: row.error == null ? null : String(row.error),
    createdAt: String(row.created_at ?? ''),
  }
}

/** 与起笔蒸馏路由一致的三段式提示词（{{...}} 由 Agent 替换）。 */
const DISTILL_PROMPTS = {
  writing: {
    system: '你是专业的长篇网络小说文风分析师。只基于提供的授权样本总结可复用的写作规律，不复刻原文，不编造作者未体现的事实。',
    prompt: '请分析以下作者材料，输出一份不超过 6000 字的 writing skill。覆盖：叙事视角与距离、句式和节奏、场景与感官描写、人物塑造、对话、冲突与悬念、章节结构、情绪曲线、常见优点与应避免的问题。使用清晰的 Markdown 标题和可执行规则。{{PREVIOUS}}\n\n{{MATERIAL}}',
    maxTokens: 7000,
  },
  persona: {
    system: '你是作者人格与创作习惯分析师。只根据样本进行谨慎推断，把事实、强推断和不确定性分开，不对真实人物作心理诊断。',
    prompt: '请根据材料输出一份不超过 3000 字的 author persona，覆盖：创作关注点、价值偏好、人物观、叙事取舍、更新与构思习惯的可观察表现，以及写作时适合的自检问题。不要声称知道作者现实生活。{{PREVIOUS}}\n\n{{MATERIAL}}',
    maxTokens: 4000,
  },
  merge: {
    system: '你是技能文档编辑。把分析结果合并成供小说写作助手使用的单一 Markdown Skill。不要提及 API、工具调用或内部流程，不要复制原文段落。',
    prompt: '请将下列 writing skill 与 author persona 合并为一份不超过 10000 字的完整小说写作 Skill。必须包含：适用范围、创作前检查、正文生成规则、人物与对话规则、章节节奏规则、完稿自检清单，并明确「作品既有设定优先」。\n\n【writing skill】\n{{WRITING_SKILL}}\n\n【author persona】\n{{AUTHOR_PERSONA}}',
    maxTokens: 9000,
  },
}

export class QibiStore {
  /**
   * @param {Record<string, unknown>} config 插件 config（allowWrite / dataDir / userId）。
   */
  constructor(config = {}, { defaultDirectory = defaultDataDir } = {}) {
    this.config = config ?? {}
    this.dataDir = resolveDataDir(this.config, defaultDirectory)
    this.dbPath = path.join(this.dataDir, 'novelforge.db')
    /** config 的硬开关：为 false 时连接以只读方式打开，任何写操作都被拒绝。 */
    this.configWritable = this.config.allowWrite !== false
    /** 面板上的临时开关，只能在 configWritable 之内收窄。 */
    this.sessionWritable = this.configWritable
    /** 写入代次：每次落盘 +1，供面板轮询发现变化。 */
    this.rev = 0
    /** 面板当前选中（`qibi_status` 会返回它）。 */
    this.selection = { novelId: null, chapterId: null }
    this.db = null
    this.openedReadOnly = null
    this.columns = new Map()
    /** 上一次看到的内容签名，用于发现面板之外的写入。 */
    this.lastSignature = null
  }

  /** 当前是否允许写。 */
  get writable() {
    return this.configWritable && this.sessionWritable
  }

  /** 面板/工具共同使用的写入开关。 */
  setWritable(next) {
    // 只能在 config 允许的范围内收窄，绝不能因为 UI 操作放宽。
    this.sessionWritable = this.configWritable ? next === true : false
    return this.writable
  }

  dispose() {
    this.#close()
  }

  // ---- 连接 ----

  #open() {
    if (this.db) return this.db
    const readOnly = !this.configWritable
    if (!fs.existsSync(this.dbPath)) {
      if (readOnly) throw new QibiError('NO_DB', `只读模式不能新建数据库：${this.dbPath}`, { dbPath: this.dbPath, dataDir: this.dataDir })
      try {
        ensureEmptyDatabase(this.dataDir)
      } catch (error) {
        throw new QibiError(error?.code ?? 'DB_INIT_FAILED', `无法初始化数据目录：${error instanceof Error ? error.message : String(error)}`, { dbPath: this.dbPath })
      }
    }
    let db
    try {
      db = new DatabaseSync(this.dbPath, { readOnly })
    } catch (error) {
      throw new QibiError('DB_OPEN_FAILED', `打不开起笔数据库：${error instanceof Error ? error.message : String(error)}`, { dbPath: this.dbPath })
    }
    db.exec('PRAGMA busy_timeout = 5000')
    try {
      db.exec('PRAGMA foreign_keys = ON')
    } catch {
      // 只读连接拒绝设置部分 pragma 时不影响读取。
    }
    this.db = db
    this.openedReadOnly = readOnly
    return db
  }

  #close() {
    if (!this.db) return
    try {
      this.db.close()
    } catch {
      // 关闭失败不影响卸载。
    }
    this.db = null
    this.openedReadOnly = null
  }

  /** 表是否存在。 */
  #hasTable(name) {
    const row = this.#open().prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(name)
    return Boolean(row)
  }

  /** 列名集合（带缓存），用于容忍缺少迁移列的历史库。 */
  #cols(table) {
    if (this.columns.has(table)) return this.columns.get(table)
    const names = new Set()
    try {
      for (const row of this.#open().prepare(`PRAGMA table_info(${JSON.stringify(table).replace(/^"|"$/g, "'")})`).all()) {
        names.add(row.name)
      }
    } catch {
      // 表不存在：空集合即可。
    }
    this.columns.set(table, names)
    return names
  }

  /** 在一个 IMMEDIATE 事务里执行 fn，失败回滚。 */
  #transaction(fn) {
    const db = this.#open()
    db.exec('BEGIN IMMEDIATE')
    try {
      const result = fn(db)
      db.exec('COMMIT')
      return result
    } catch (error) {
      try {
        db.exec('ROLLBACK')
      } catch {
        // 回滚失败时保留原始错误。
      }
      throw error
    }
  }

  #assertWritable(action) {
    if (!this.configWritable) {
      throw new QibiError('READ_ONLY', `插件当前是只读模式，不能${action}。把插件 config 的 allowWrite 设为 true 后重启 DSH 即可。`, { configWritable: false })
    }
    if (!this.sessionWritable) {
      throw new QibiError('WRITE_DISABLED', `面板里的写入开关是关闭的，不能${action}。`, { sessionWritable: false })
    }
  }

  /** 资料类实体的写前校验：带 token 且与事务内现状不符就拒绝。 */
  #assertEntityToken(expectedToken, currentToken, label) {
    if (expectedToken === undefined || expectedToken === null || expectedToken === '') return
    if (expectedToken !== currentToken) {
      throw new QibiError('ENTITY_CONFLICT', `${label}已被其他窗口或 Agent 修改，请重新加载后再保存。`, { currentToken })
    }
  }

  #bump() {
    this.rev += 1
  }

  /**
   * 内容签名：章节/作品以及资料表（大纲、人物、账本、分卷、摘要、写作状态）的数量与最新更新时间。
   * 起笔应用或 Agent 写入后，这个签名会变，于是面板能发现自己之外的变化。
   * @returns {string} 形如 `4|2026-11-18 12:00:00|2|…|3:…|5:…`。
   */
  signature() {
    const db = this.#open()
    const chapters = db.prepare("SELECT COUNT(*) AS c, COALESCE(MAX(updated_at), '') AS u FROM chapters").get()
    const novels = db.prepare("SELECT COUNT(*) AS c, COALESCE(MAX(updated_at), '') AS u FROM novels").get()
    const extra = []
    for (const table of ['outlines', 'characters', 'character_states', 'volumes', 'chapter_summaries', 'novel_writer_state']) {
      if (!this.#hasTable(table)) {
        extra.push('-')
        continue
      }
      try {
        const row = db.prepare(`SELECT COUNT(*) AS c, COALESCE(MAX(updated_at), '') AS u FROM ${table}`).get()
        extra.push(`${Number(row?.c ?? 0)}:${String(row?.u ?? '')}`)
      } catch {
        extra.push('-')
      }
    }
    return `${Number(chapters?.c ?? 0)}|${String(chapters?.u ?? '')}|${Number(novels?.c ?? 0)}|${String(novels?.u ?? '')}|${extra.join('|')}`
  }

  /**
   * 供面板轮询：签名变了就推进一次 rev。
   * @returns {number} 当前写入代次。
   */
  refreshRev() {
    try {
      const next = this.signature()
      if (next !== this.lastSignature) {
        this.lastSignature = next
        this.rev += 1
      }
    } catch {
      // 库暂时不可读（未初始化/被锁）时忽略，下一次轮询再试。
    }
    return this.rev
  }

  // ---- 用户与作品 ----

  /** 解析当前起笔用户：config.userId > 第一个拥有作品的未禁用用户 > 第一个未禁用用户。 */
  user() {
    const db = this.#open()
    const configured = Number(this.config.userId)
    if (Number.isFinite(configured) && configured > 0) {
      const row = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(configured)
      if (row) return { id: Number(row.id), username: String(row.username), role: String(row.role) }
    }
    const owner = db.prepare(
      'SELECT u.id AS id, u.username AS username, u.role AS role FROM users u WHERE u.disabled = 0 AND EXISTS (SELECT 1 FROM novels n WHERE n.user_id = u.id) ORDER BY u.id LIMIT 1',
    ).get()
    if (owner) return { id: Number(owner.id), username: String(owner.username), role: String(owner.role) }
    const first = db.prepare('SELECT id, username, role FROM users WHERE disabled = 0 ORDER BY id LIMIT 1').get()
    if (first) return { id: Number(first.id), username: String(first.username), role: String(first.role) }
    return null
  }

  /** 所有可选用户（面板与 config 参考）。 */
  users() {
    const rows = this.#open().prepare('SELECT id, username, role, disabled FROM users ORDER BY id').all()
    return rows.map(row => ({ id: Number(row.id), username: String(row.username), role: String(row.role), disabled: Number(row.disabled) === 1 }))
  }

  /** 作品列表（含章节数与总字数）。 */
  novels() {
    const db = this.#open()
    const user = this.user()
    const columns = this.#cols('novels')
    const intro = columns.has('intro') ? 'n.intro' : "'' AS intro"
    const isPublic = columns.has('is_public') ? 'n.is_public' : '0 AS is_public'
    const rows = db.prepare(
      `SELECT n.id, n.title, n.author, n.genre, n.status, ${intro}, ${isPublic}, n.word_count, n.updated_at,
              (SELECT COUNT(*) FROM chapters c WHERE c.novel_id = n.id) AS chapter_count
         FROM novels n
        WHERE n.user_id = ?
        ORDER BY n.updated_at DESC, n.id DESC`,
    ).all(user?.id ?? -1)
    return rows.map(row => ({
      id: Number(row.id),
      title: String(row.title),
      author: String(row.author ?? ''),
      genre: String(row.genre ?? ''),
      status: String(row.status ?? ''),
      intro: String(row.intro ?? ''),
      isPublic: Number(row.is_public ?? 0) === 1,
      wordCount: Number(row.word_count ?? 0),
      chapterCount: Number(row.chapter_count ?? 0),
      updatedAt: String(row.updated_at ?? ''),
    }))
  }

  /** 某部作品的章节列表（不含正文）。 */
  chapters(novelId) {
    const db = this.#open()
    this.#assertOwnNovel(novelId)
    const hasVolume = this.#cols('chapters').has('volume_id') && this.#hasTable('volumes')
    const select = hasVolume
      ? `SELECT c.id, c.title, c.status, c.word_count, c.sort_order, c.updated_at, c.volume_id, v.title AS volume_title
           FROM chapters c LEFT JOIN volumes v ON v.id = c.volume_id`
      : 'SELECT c.id, c.title, c.status, c.word_count, c.sort_order, c.updated_at FROM chapters c'
    const rows = db.prepare(`${select} WHERE c.novel_id = ? ORDER BY c.sort_order, c.id`).all(novelId)
    return rows.map(row => ({
      id: Number(row.id),
      title: String(row.title),
      status: String(row.status ?? ''),
      wordCount: Number(row.word_count ?? 0),
      order: Number(row.sort_order ?? 0),
      updatedAt: String(row.updated_at ?? ''),
      volumeId: row.volume_id == null ? null : Number(row.volume_id),
      volumeTitle: row.volume_title == null ? null : String(row.volume_title),
    }))
  }

  /** 单章全文。 */
  chapter(chapterId) {
    const db = this.#open()
    const row = db.prepare('SELECT id, novel_id, title, content, status, word_count, sort_order, updated_at FROM chapters WHERE id = ?').get(chapterId)
    if (!row) throw new QibiError('CHAPTER_NOT_FOUND', `章节不存在：${chapterId}`, { chapterId })
    this.#assertOwnNovel(row.novel_id)
    const content = String(row.content ?? '')
    return {
      id: Number(row.id),
      novelId: Number(row.novel_id),
      title: String(row.title),
      status: String(row.status ?? ''),
      content,
      wordCount: Number(row.word_count ?? 0),
      order: Number(row.sort_order ?? 0),
      updatedAt: String(row.updated_at ?? ''),
      token: chapterToken(String(row.updated_at ?? ''), content),
    }
  }

  /** 当前作者 id；没有可用用户时拒绝写操作。 */
  #userId() {
    const user = this.user()
    if (!user) throw new QibiError('NO_USER', '起笔里还没有可用用户', {})
    return user.id
  }

  /** 作品存在且属于当前作者（不到别的作者库里操作）。 */
  #assertOwnNovel(novelId) {
    const id = Number(novelId)
    if (!Number.isFinite(id) || id <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 novelId', { novelId })
    const row = this.#open().prepare('SELECT id, user_id FROM novels WHERE id = ?').get(id)
    if (!row || Number(row.user_id) !== this.#userId()) {
      throw new QibiError('NOVEL_NOT_FOUND', `作品不存在：${id}`, { novelId: id })
    }
    return id
  }

  /** 章节存在且属于指定作品（防止把大纲挂到别的作品的章节上）。 */
  #assertChapterInNovel(chapterId, novelId) {
    const id = Number(chapterId)
    if (!Number.isFinite(id) || id <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 chapterId', { chapterId })
    const row = this.#open().prepare('SELECT novel_id FROM chapters WHERE id = ?').get(id)
    if (!row || Number(row.novel_id) !== Number(novelId)) {
      throw new QibiError('BAD_ARGUMENT', '章节不属于这部作品', { chapterId: id, novelId })
    }
    return id
  }

  /** 蒸馏作者存在且属于当前作者。 */
  #assertOwnDistilledAuthor(authorId) {
    const id = Number(authorId)
    if (!Number.isFinite(id) || id <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 authorId', { authorId })
    const row = this.#open().prepare('SELECT * FROM distilled_authors WHERE id = ?').get(id)
    if (!row || Number(row.user_id) !== this.#userId()) {
      throw new QibiError('AUTHOR_NOT_FOUND', `蒸馏作者不存在：${id}`, { authorId: id })
    }
    return row
  }

  /** 蒸馏作者 → 面板对象（带当前版本）。 */
  #publicDistilledAuthor(row) {
    const db = this.#open()
    const current = row.current_version_id == null
      ? null
      : db.prepare('SELECT * FROM distilled_author_versions WHERE id = ?').get(row.current_version_id)
    const sources = db.prepare('SELECT COUNT(*) AS c FROM distilled_author_sources WHERE author_id = ?').get(row.id)
    return {
      id: Number(row.id),
      name: String(row.name),
      slug: String(row.slug),
      profile: parseProfile(row.profile),
      status: String(row.status ?? 'draft'),
      currentVersionId: row.current_version_id == null ? null : Number(row.current_version_id),
      currentVersion: current ? publicDistillVersion(current) : null,
      sourceCount: Number(sources?.c ?? 0),
      createdAt: String(row.created_at ?? ''),
      updatedAt: String(row.updated_at ?? ''),
    }
  }

  /** 素材文件目录。 */
  #distillDir(userId, authorId) {
    return path.join(this.dataDir, 'skill-materials', String(userId), String(authorId))
  }

  /** 素材行 + 归属校验。 */
  #sourceForUser(sourceId) {
    const id = Number(sourceId)
    if (!Number.isFinite(id) || id <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 sourceId', { sourceId })
    const row = this.#open().prepare('SELECT * FROM distilled_author_sources WHERE id = ?').get(id)
    if (!row) throw new QibiError('SOURCE_NOT_FOUND', `素材不存在：${id}`, { sourceId: id })
    this.#assertOwnDistilledAuthor(row.author_id)
    return row
  }

  /** 样本 sidecar：避免每次读素材都重新解析大文件。 */
  #samplePath(storedPath) {
    return `${storedPath}.sample.txt`
  }

  /** 删除文件，忽略不存在。 */
  #unlink(filePath) {
    try {
      fs.unlinkSync(filePath)
    } catch {
      // 文件不存在或已删除。
    }
  }

  // ---- 写 ----

  /**
   * 覆盖一章正文。
   *
   * 乐观锁：`expectedToken`（推荐，读章节时拿到）或 `expectedUpdatedAt`（弱锁，秒级精度）
   * 任一与磁盘现状不符就拒绝写入，绝不覆盖作者手稿。
   * @param {{ chapterId:number, content:string, expectedToken?:string, expectedUpdatedAt?:string }} input
   */
  saveChapter(input) {
    this.#assertWritable('保存正文')
    const chapterId = Number(input?.chapterId)
    const content = typeof input?.content === 'string' ? input.content : ''
    const expectedToken = typeof input?.expectedToken === 'string' && input.expectedToken !== '' ? input.expectedToken : undefined
    const expectedUpdatedAt = typeof input?.expectedUpdatedAt === 'string' ? input.expectedUpdatedAt : undefined
    if (!Number.isFinite(chapterId) || chapterId <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 chapterId', { chapterId })
    if (content.length > 2_000_000) throw new QibiError('CONTENT_TOO_LONG', '单章超过 200 万字上限，请拆分章节。', { length: content.length })

    const wordCount = countChineseChars(content)
    // 读取、令牌校验、备份与更新都必须在同一个 BEGIN IMMEDIATE 内完成，
    // 否则起笔进程可以在 SELECT 与 BEGIN 之间提交新稿，造成静默覆盖。
    const revisionId = this.#transaction(txn => {
      const current = txn.prepare('SELECT id, novel_id, title, content, word_count, updated_at FROM chapters WHERE id = ?').get(chapterId)
      if (!current) throw new QibiError('CHAPTER_NOT_FOUND', `章节不存在：${chapterId}`, { chapterId })
      this.#assertOwnNovel(current.novel_id)
      const currentToken = chapterToken(String(current.updated_at ?? ''), String(current.content ?? ''))
      const mismatch = expectedToken !== undefined
        ? currentToken !== expectedToken
        : (expectedUpdatedAt !== undefined && String(current.updated_at ?? '') !== expectedUpdatedAt)
      if (mismatch) {
        throw new QibiError('CHAPTER_CONFLICT', '起笔里的这一章已被改动，为避免覆盖手稿没有写入。', {
          chapterId,
          currentUpdatedAt: String(current.updated_at ?? ''),
          currentToken,
        })
      }

      // 写前备份（空正文不建备份，与起笔 saveChapterRevision 一致）。
      let revision = null
      if (String(current.content ?? '').trim()) {
        const novel = txn.prepare('SELECT user_id FROM novels WHERE id = ?').get(current.novel_id)
        if (novel) {
          const info = txn.prepare(
            'INSERT INTO chapter_revisions (chapter_id, novel_id, user_id, title, content, word_count, reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ).run(
            chapterId,
            current.novel_id,
            novel.user_id,
            String(current.title ?? ''),
            String(current.content ?? ''),
            countChineseChars(String(current.content ?? '')),
            'DSH 写入前备份',
          )
          revision = Number(info.lastInsertRowid)
          txn.prepare(
            'DELETE FROM chapter_revisions WHERE chapter_id = ? AND id NOT IN (SELECT id FROM chapter_revisions WHERE chapter_id = ? ORDER BY id DESC LIMIT 50)',
          ).run(chapterId, chapterId)
        }
      }
      txn.prepare("UPDATE chapters SET content = ?, word_count = ?, updated_at = datetime('now') WHERE id = ?").run(content, wordCount, chapterId)
      this.#touchNovel(txn, current.novel_id)
      this.#reindexChapter(txn, current.novel_id, chapterId)
      return revision
    })
    this.#bump()
    return { chapter: this.chapter(chapterId), revisionId }
  }

  /**
   * 单独留存一条章节版本（不覆盖正文）。
   * 用于把 AI 生成结果、手动快照等留在起笔的版本历史里，可按版本恢复。
   */
  addRevision(input) {
    this.#assertWritable('保存版本')
    const chapterId = Number(input?.chapterId)
    if (!Number.isFinite(chapterId) || chapterId <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 chapterId', { chapterId })
    const content = typeof input?.content === 'string' ? input.content : ''
    if (!content.trim()) throw new QibiError('BAD_ARGUMENT', '版本内容不能为空', {})
    const wordCount = countChineseChars(content)
    const reason = typeof input?.reason === 'string' && input.reason.trim()
      ? input.reason.trim().slice(0, 40)
      : '手动留存'
    const result = this.#transaction(txn => {
      const chapter = txn.prepare('SELECT id, novel_id, title FROM chapters WHERE id = ?').get(chapterId)
      if (!chapter) throw new QibiError('CHAPTER_NOT_FOUND', `章节不存在：${chapterId}`, { chapterId })
      this.#assertOwnNovel(chapter.novel_id)
      const novel = txn.prepare('SELECT user_id FROM novels WHERE id = ?').get(chapter.novel_id)
      if (!novel) throw new QibiError('NOVEL_NOT_FOUND', '作品不存在', { novelId: chapter.novel_id })
      const info = txn.prepare(
        'INSERT INTO chapter_revisions (chapter_id, novel_id, user_id, title, content, word_count, reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).run(chapterId, chapter.novel_id, novel.user_id, String(chapter.title ?? ''), content, wordCount, reason)
      txn.prepare(
        'DELETE FROM chapter_revisions WHERE chapter_id = ? AND id NOT IN (SELECT id FROM chapter_revisions WHERE chapter_id = ? ORDER BY id DESC LIMIT 50)',
      ).run(chapterId, chapterId)
      return { revision: { id: Number(info.lastInsertRowid), reason, wordCount } }
    })
    this.#bump()
    return result
  }

  /** 追加一章（正文可为空）。 */
  createChapter(input) {    this.#assertWritable('新建章节')
    const novelId = this.#assertOwnNovel(input?.novelId)
    const title = typeof input?.title === 'string' ? input.title.trim() : ''
    if (!title) throw new QibiError('BAD_ARGUMENT', '章节标题不能为空', {})
    const db = this.#open()
    const max = Number(db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM chapters WHERE novel_id = ?').get(novelId)?.m ?? 0)
    const info = this.#transaction(txn => {
      const result = txn.prepare('INSERT INTO chapters (novel_id, title, sort_order) VALUES (?, ?, ?)').run(novelId, title, max + 1)
      this.#touchNovel(txn, novelId)
      return result
    })
    this.#bump()
    return { chapter: this.chapter(Number(info.lastInsertRowid)) }
  }

  /** 与起笔 touchNovel 一致：刷新作品时间戳并重算总字数。 */
  #touchNovel(txn, novelId) {
    txn.prepare("UPDATE novels SET updated_at = datetime('now') WHERE id = ?").run(novelId)
    const row = txn.prepare('SELECT COALESCE(SUM(word_count), 0) AS wc FROM chapters WHERE novel_id = ?').get(novelId)
    txn.prepare('UPDATE novels SET word_count = ? WHERE id = ?').run(Number(row?.wc ?? 0), novelId)
  }

  /** 与起笔 kb.indexOne(novelId,'chapter',id) 一致：重建该章的知识库分块。 */
  #reindexChapter(txn, novelId, chapterId) {
    if (!this.#hasTable('kb_chunks')) return
    txn.prepare("DELETE FROM kb_chunks WHERE novel_id = ? AND source_kind = 'chapter' AND source_id = ?").run(novelId, chapterId)
    const row = txn.prepare('SELECT id, title, content FROM chapters WHERE id = ?').get(chapterId)
    if (!row || !String(row.content ?? '').trim()) return
    const insert = txn.prepare('INSERT INTO kb_chunks (novel_id, source_kind, source_id, title, content) VALUES (?, ?, ?, ?, ?)')
    for (const seg of splitChunks(String(row.content), 480)) {
      insert.run(novelId, 'chapter', Number(row.id), `第${row.id}章 ${row.title}`, seg)
    }
  }

  /** 与起笔 kb.indexOne(novelId,'outline',id) 一致。 */
  #indexOutline(txn, novelId, outlineId) {
    if (!this.#hasTable('kb_chunks')) return
    txn.prepare("DELETE FROM kb_chunks WHERE novel_id = ? AND source_kind = 'outline' AND source_id = ?").run(novelId, outlineId)
    const row = txn.prepare('SELECT id, title, content, chapter_id FROM outlines WHERE id = ?').get(outlineId)
    if (!row) return
    const body = `【${row.chapter_id ? '本章细纲' : '总纲'}】${row.title}\n${row.content || ''}`.trim()
    if (!body) return
    txn.prepare('INSERT INTO kb_chunks (novel_id, source_kind, source_id, title, content) VALUES (?, ?, ?, ?, ?)').run(
      novelId, 'outline', Number(row.id), String(row.title ?? ''), body,
    )
  }

  /** 与起笔 kb.indexOne(novelId,'character',id) 一致。 */
  #indexCharacter(txn, novelId, characterId) {
    if (!this.#hasTable('kb_chunks')) return
    txn.prepare("DELETE FROM kb_chunks WHERE novel_id = ? AND source_kind = 'character' AND source_id = ?").run(novelId, characterId)
    const row = txn.prepare('SELECT id, name, alias, role, gender, personality, appearance, background FROM characters WHERE id = ?').get(characterId)
    if (!row) return
    const body = `【人物】${row.name}${row.alias ? `（${row.alias}）` : ''} ${row.role || ''}\n${[
      row.gender ? `性别：${row.gender}` : '',
      row.personality ? `性格：${row.personality}` : '',
      row.appearance ? `外貌：${row.appearance}` : '',
      row.background ? `背景：${row.background}` : '',
    ].filter(Boolean).join('\n')}`
    txn.prepare('INSERT INTO kb_chunks (novel_id, source_kind, source_id, title, content) VALUES (?, ?, ?, ?, ?)').run(
      novelId, 'character', Number(row.id), String(row.name ?? ''), body,
    )
  }

  /** 删除某个源的全部知识库分块。 */
  #dropChunks(txn, novelId, sourceKind, sourceId) {
    if (!this.#hasTable('kb_chunks')) return
    txn.prepare('DELETE FROM kb_chunks WHERE novel_id = ? AND source_kind = ? AND source_id = ?').run(novelId, sourceKind, sourceId)
  }

  // ---- 读（跨域） ----

  /** 人物卡 + 动态账本（缺列时自动降级）。 */
  characters(novelId) {
    const db = this.#open()
    const id = this.#assertOwnNovel(novelId)
    const stateCols = this.#cols('character_states')
    const extras = ['current_location', 'current_realm', 'notes'].filter(col => stateCols.has(col))
    const joinExtras = extras.length > 0
      ? `, ${extras.map(col => `s.${col} AS ${col}`).join(', ')}`
      : ''
    const join = stateCols.size > 0 ? `LEFT JOIN character_states s ON s.character_id = c.id` : ''
    const rows = db.prepare(
      `SELECT c.id, c.name, c.alias, c.role, c.gender, c.age, c.appearance, c.personality, c.background, c.sort_order, c.updated_at${joinExtras}
         FROM characters c ${join}
        WHERE c.novel_id = ?
        ORDER BY c.sort_order, c.id`,
    ).all(id)
    return rows.map(row => ({
      id: Number(row.id),
      name: String(row.name),
      alias: String(row.alias ?? ''),
      role: String(row.role ?? ''),
      gender: String(row.gender ?? ''),
      age: String(row.age ?? ''),
      appearance: String(row.appearance ?? ''),
      personality: String(row.personality ?? ''),
      background: String(row.background ?? ''),
      location: row.current_location == null ? '' : String(row.current_location),
      realm: row.current_realm == null ? '' : String(row.current_realm),
      notes: row.notes == null ? '' : String(row.notes),
      token: entityToken(row.updated_at, [row.id, row.name, row.alias, row.role, row.gender, row.age, row.appearance, row.personality, row.background]),
    }))
  }

  /** 大纲条目（总纲 chapter_id 为 null，细纲挂在章上）。 */
  outline(novelId) {
    const db = this.#open()
    const id = this.#assertOwnNovel(novelId)
    const rows = db.prepare('SELECT id, chapter_id, title, content, sort_order, updated_at FROM outlines WHERE novel_id = ? ORDER BY sort_order, id').all(id)
    return rows.map(row => ({
      id: Number(row.id),
      chapterId: row.chapter_id == null ? null : Number(row.chapter_id),
      title: String(row.title ?? ''),
      content: String(row.content ?? ''),
      token: entityToken(row.updated_at, [row.id, row.chapter_id, row.title, row.content]),
    }))
  }

  /** 关键词检索：章节正文/标题 + 人物。有界返回，不做全库扫描以外的推理。 */
  search(query, novelId) {
    const q = typeof query === 'string' ? query.trim() : ''
    if (!q) return { chapters: [], characters: [] }
    const db = this.#open()
    const like = `%${q}%`
    const userId = this.#userId()
    const scopeNovel = novelId === undefined || novelId === null ? null : this.#assertOwnNovel(novelId)
    const chapterRows = scopeNovel === null
      ? db.prepare('SELECT id, novel_id, title, status, word_count, content FROM chapters WHERE novel_id IN (SELECT id FROM novels WHERE user_id = ?) AND (title LIKE ? OR content LIKE ?) ORDER BY updated_at DESC LIMIT 20').all(userId, like, like)
      : db.prepare('SELECT id, novel_id, title, status, word_count, content FROM chapters WHERE novel_id = ? AND (title LIKE ? OR content LIKE ?) ORDER BY sort_order LIMIT 20').all(scopeNovel, like, like)
    const characterRows = scopeNovel === null
      ? db.prepare('SELECT id, novel_id, name, role, background FROM characters WHERE novel_id IN (SELECT id FROM novels WHERE user_id = ?) AND (name LIKE ? OR alias LIKE ? OR background LIKE ?) LIMIT 20').all(userId, like, like, like)
      : db.prepare('SELECT id, novel_id, name, role, background FROM characters WHERE novel_id = ? AND (name LIKE ? OR alias LIKE ? OR background LIKE ?) LIMIT 20').all(scopeNovel, like, like, like)
    return {
      chapters: chapterRows.map(row => ({
        id: Number(row.id),
        novelId: Number(row.novel_id),
        title: String(row.title),
        status: String(row.status ?? ''),
        wordCount: Number(row.word_count ?? 0),
        snippet: snippetAround(String(row.content ?? ''), q),
      })),
      characters: characterRows.map(row => ({
        id: Number(row.id),
        novelId: Number(row.novel_id),
        name: String(row.name),
        role: String(row.role ?? ''),
        background: String(row.background ?? ''),
      })),
    }
  }

  /** 连接摘要：面板首屏一次拿全。 */
  status() {
    const base = {
      dataDir: this.dataDir,
      dbPath: this.dbPath,
      exists: fs.existsSync(this.dbPath),
      writable: this.writable,
      configWritable: this.configWritable,
      user: null,
      users: [],
      counts: { novels: 0, chapters: 0, words: 0 },
      error: null,
    }
    try {
      const db = this.#open()
      base.exists = true
      base.user = this.user()
      base.users = this.users()
      const user = base.user
      const novels = db.prepare('SELECT COUNT(*) AS c, COALESCE(SUM(word_count), 0) AS w FROM novels WHERE user_id = ?').get(user?.id ?? -1)
      const chapters = db.prepare('SELECT COUNT(*) AS c FROM chapters WHERE novel_id IN (SELECT id FROM novels WHERE user_id = ?)').get(user?.id ?? -1)
      base.counts = {
        novels: Number(novels?.c ?? 0),
        chapters: Number(chapters?.c ?? 0),
        words: Number(novels?.w ?? 0),
      }
    } catch (error) {
      base.error = toPublicError(error)
    }
    return base
  }

  /** 设置面板选中章节（`qibi_status` 与系统提示都读它）。 */
  select(input) {
    const novelId = input?.novelId == null ? null : Number(input.novelId)
    const chapterId = input?.chapterId == null ? null : Number(input.chapterId)
    this.selection = {
      novelId: Number.isFinite(novelId) ? novelId : null,
      chapterId: Number.isFinite(chapterId) ? chapterId : null,
    }
    return this.selection
  }

  /** 系统提示里的一行选中上下文。 */
  selectionLine() {
    try {
      const { novelId, chapterId } = this.selection
      if (novelId == null) return ''
      const novel = this.#open().prepare('SELECT title FROM novels WHERE id = ?').get(novelId)
      if (!novel) return ''
      let line = `起笔：作者当前在 DSH 面板里选中了作品《${novel.title}》`
      if (chapterId != null) {
        const chapter = this.#open().prepare('SELECT title FROM chapters WHERE id = ?').get(chapterId)
        if (chapter) line += `·${chapter.title}`
      }
      return `${line}。未指明章节时，默认指这一章。`
    } catch {
      return ''
    }
  }
  // ---- 作品 / 章节的结构性写入 ----

  /** 新建作品。 */
  createNovel(input) {
    this.#assertWritable('新建作品')
    const title = typeof input?.title === 'string' ? input.title.trim() : ''
    if (!title) throw new QibiError('BAD_ARGUMENT', '作品名不能为空', {})
    const user = this.user()
    if (!user) throw new QibiError('NO_USER', '起笔里还没有可用用户', {})
    const palette = ['#e60012', '#d4a017', '#2b6cb0', '#2f855a', '#6b46c1', '#b7791f']
    const color = palette[Math.floor(Math.random() * palette.length)]
    const db = this.#open()
    const info = db.prepare(
      'INSERT INTO novels (user_id, title, author, genre, status, intro, cover_color) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(
      user.id,
      title,
      typeof input?.author === 'string' ? input.author : user.username,
      typeof input?.genre === 'string' && input.genre ? input.genre : '玄幻',
      typeof input?.status === 'string' && input.status ? input.status : '连载中',
      typeof input?.intro === 'string' ? input.intro : '',
      color,
    )
    this.#bump()
    const row = db.prepare('SELECT id FROM novels WHERE id = ?').get(info.lastInsertRowid)
    return { novel: this.novels().find(novel => novel.id === Number(row.id)) ?? null }
  }

  /** 修改作品元数据（标题/作者/题材/状态/简介/公开性）。 */
  updateNovel(input) {
    this.#assertWritable('修改作品信息')
    const novelId = this.#assertOwnNovel(input?.novelId)
    const fields = []
    const values = []
    const map = {
      title: 'title', author: 'author', genre: 'genre', status: 'status', intro: 'intro', coverColor: 'cover_color', isPublic: 'is_public',
    }
    for (const [key, column] of Object.entries(map)) {
      if (input?.[key] === undefined) continue
      fields.push(`${column} = ?`)
      values.push(key === 'isPublic' ? (input.isPublic ? 1 : 0) : String(input[key]))
    }
    if (fields.length === 0) throw new QibiError('BAD_ARGUMENT', '没有要修改的字段', {})
    fields.push("updated_at = datetime('now')")
    this.#open().prepare(`UPDATE novels SET ${fields.join(', ')} WHERE id = ?`).run(...values, novelId)
    this.#bump()
    return { novel: this.novels().find(novel => novel.id === novelId) ?? null }
  }

  /** 删除作品（级联删除章节/人物/大纲等），必须显式 confirm。 */
  deleteNovel(input) {
    this.#assertWritable('删除作品')
    const novelId = this.#assertOwnNovel(input?.novelId)
    if (input?.confirm !== true) throw new QibiError('CONFIRM_REQUIRED', '删除作品会连带删除全部章节与设定，需要 confirm: true', { novelId })
    this.#open().prepare('DELETE FROM novels WHERE id = ?').run(novelId)
    this.#bump()
    return { deleted: novelId }
  }

  /** 修改章节标题/状态（正文走 saveChapter）。 */
  updateChapter(input) {
    this.#assertWritable('修改章节信息')
    const chapterId = Number(input?.chapterId)
    if (!Number.isFinite(chapterId) || chapterId <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 chapterId', {})
    const db = this.#open()
    const current = db.prepare('SELECT id, novel_id FROM chapters WHERE id = ?').get(chapterId)
    if (!current) throw new QibiError('CHAPTER_NOT_FOUND', `章节不存在：${chapterId}`, { chapterId })
    this.#assertOwnNovel(current.novel_id)
    const fields = []
    const values = []
    if (typeof input?.title === 'string' && input.title.trim()) {
      fields.push('title = ?')
      values.push(input.title.trim())
    }
    if (typeof input?.status === 'string' && input.status.trim()) {
      fields.push('status = ?')
      values.push(input.status.trim())
    }
    if (fields.length === 0) throw new QibiError('BAD_ARGUMENT', '没有要修改的字段', {})
    fields.push("updated_at = datetime('now')")
    this.#transaction(txn => {
      txn.prepare(`UPDATE chapters SET ${fields.join(', ')} WHERE id = ?`).run(...values, chapterId)
      this.#touchNovel(txn, current.novel_id)
    })
    this.#bump()
    return { chapter: this.chapter(chapterId) }
  }

  /** 删除章节，必须显式 confirm。正文先备份到 dataDir/chapter-backups（chapter_revisions 会随章节级联删除）。 */
  deleteChapter(input) {
    this.#assertWritable('删除章节')
    const chapterId = Number(input?.chapterId)
    if (!Number.isFinite(chapterId) || chapterId <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 chapterId', {})
    if (input?.confirm !== true) throw new QibiError('CONFIRM_REQUIRED', '删除章节需要 confirm: true', { chapterId })
    const db = this.#open()
    const current = db.prepare('SELECT id, novel_id, title, content FROM chapters WHERE id = ?').get(chapterId)
    if (!current) throw new QibiError('CHAPTER_NOT_FOUND', `章节不存在：${chapterId}`, { chapterId })
    this.#assertOwnNovel(current.novel_id)

    let backupPath = null
    const content = String(current.content ?? '')
    if (content.trim()) {
      const dir = path.join(this.dataDir, 'chapter-backups')
      try {
        fs.mkdirSync(dir, { recursive: true })
        backupPath = path.join(dir, `chapter-${chapterId}-${Date.now()}.json`)
        fs.writeFileSync(backupPath, JSON.stringify({
          chapterId,
          novelId: Number(current.novel_id),
          title: String(current.title ?? ''),
          content,
          deletedAt: new Date().toISOString(),
        }, null, 2), 'utf8')
      } catch (error) {
        throw new QibiError('BACKUP_FAILED', `删除前备份失败，章节未删除：${error instanceof Error ? error.message : String(error)}`, { chapterId })
      }
    }

    this.#transaction(txn => {
      if (this.#hasTable('kb_chunks')) {
        txn.prepare("DELETE FROM kb_chunks WHERE novel_id = ? AND source_kind = 'chapter' AND source_id = ?").run(current.novel_id, chapterId)
      }
      txn.prepare('DELETE FROM chapters WHERE id = ?').run(chapterId)
      this.#touchNovel(txn, current.novel_id)
    })
    this.#bump()
    return { deleted: chapterId, backupPath }
  }

  /** 上移/下移一章（与起笔一致：按实际顺序重排 sort_order）。 */
  moveChapter(input) {
    this.#assertWritable('移动章节')
    const chapterId = Number(input?.chapterId)
    const direction = input?.direction === 'up' ? 'up' : input?.direction === 'down' ? 'down' : null
    if (!Number.isFinite(chapterId) || !direction) throw new QibiError('BAD_ARGUMENT', '需要 chapterId 与 direction(up|down)', {})
    const db = this.#open()
    const current = db.prepare('SELECT id, novel_id FROM chapters WHERE id = ?').get(chapterId)
    if (!current) throw new QibiError('CHAPTER_NOT_FOUND', `章节不存在：${chapterId}`, { chapterId })
    this.#assertOwnNovel(current.novel_id)
    const rows = db.prepare('SELECT id FROM chapters WHERE novel_id = ? ORDER BY sort_order, id').all(current.novel_id).map(row => Number(row.id))
    const index = rows.indexOf(chapterId)
    const target = direction === 'up' ? index - 1 : index + 1
    if (index < 0 || target < 0 || target >= rows.length) return { moved: false, order: rows }
    const next = [...rows]
    next[index] = rows[target]
    next[target] = rows[index]
    this.#transaction(txn => {
      const update = txn.prepare('UPDATE chapters SET sort_order = ? WHERE id = ?')
      next.forEach((id, position) => update.run(position + 1, id))
    })
    this.#bump()
    return { moved: true, order: next }
  }

  // ---- 版本历史 ----

  /** 章节的版本列表（不含正文）。 */
  revisions(chapterId) {
    const id = Number(chapterId)
    if (!Number.isFinite(id) || id <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 chapterId', {})
    this.chapter(id)
    const rows = this.#open().prepare(
      'SELECT id, title, word_count, reason, created_at FROM chapter_revisions WHERE chapter_id = ? ORDER BY id DESC',
    ).all(id)
    return rows.map(row => ({
      id: Number(row.id),
      title: String(row.title ?? ''),
      wordCount: Number(row.word_count ?? 0),
      reason: String(row.reason ?? ''),
      createdAt: String(row.created_at ?? ''),
    }))
  }

  /** 恢复某个历史版本（先备份当前正文）。 */
  restoreRevision(input) {
    this.#assertWritable('恢复历史版本')
    const chapterId = Number(input?.chapterId)
    const revisionId = Number(input?.revisionId)
    if (!Number.isFinite(chapterId) || !Number.isFinite(revisionId)) throw new QibiError('BAD_ARGUMENT', '需要 chapterId 与 revisionId', {})
    // 与 saveChapter 同理：读取当前正文与历史版本、校验归属、备份、覆盖都在同一事务内。
    this.#transaction(txn => {
      const current = txn.prepare('SELECT id, novel_id, title, content FROM chapters WHERE id = ?').get(chapterId)
      if (!current) throw new QibiError('CHAPTER_NOT_FOUND', `章节不存在：${chapterId}`, { chapterId })
      this.#assertOwnNovel(current.novel_id)
      const revision = txn.prepare('SELECT id, title, content FROM chapter_revisions WHERE id = ? AND chapter_id = ?').get(revisionId, chapterId)
      if (!revision) throw new QibiError('REVISION_NOT_FOUND', `版本不存在：${revisionId}`, { chapterId, revisionId })
      const wordCount = countChineseChars(String(revision.content ?? ''))
      const novel = txn.prepare('SELECT user_id FROM novels WHERE id = ?').get(current.novel_id)
      if (novel && String(current.content ?? '').trim()) {
        txn.prepare(
          'INSERT INTO chapter_revisions (chapter_id, novel_id, user_id, title, content, word_count, reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ).run(chapterId, current.novel_id, novel.user_id, String(current.title ?? ''), String(current.content ?? ''), countChineseChars(String(current.content ?? '')), '恢复历史版本前备份')
      }
      txn.prepare("UPDATE chapters SET title = ?, content = ?, word_count = ?, updated_at = datetime('now') WHERE id = ?").run(
        String(revision.title ?? current.title), String(revision.content ?? ''), wordCount, chapterId,
      )
      this.#touchNovel(txn, current.novel_id)
      this.#reindexChapter(txn, current.novel_id, chapterId)
    })
    this.#bump()
    return { chapter: this.chapter(chapterId) }
  }

  // ---- 大纲 ----

  /** 新建大纲条目（chapterId 为空表示总纲）。 */
  createOutline(input) {
    this.#assertWritable('新建大纲')
    const novelId = this.#assertOwnNovel(input?.novelId)
    const chapterId = input?.chapterId == null ? null : this.#assertChapterInNovel(input.chapterId, novelId)
    const info = this.#transaction(txn => {
      const max = Number(txn.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM outlines WHERE novel_id = ?').get(novelId)?.m ?? 0)
      const result = txn.prepare('INSERT INTO outlines (novel_id, chapter_id, title, content, sort_order) VALUES (?, ?, ?, ?, ?)').run(
        novelId,
        chapterId,
        typeof input?.title === 'string' ? input.title : '',
        typeof input?.content === 'string' ? input.content : '',
        max + 1,
      )
      this.#indexOutline(txn, novelId, Number(result.lastInsertRowid))
      return result
    })
    this.#bump()
    return { id: Number(info.lastInsertRowid), outline: this.outline(novelId) }
  }

  /** 修改大纲条目。`expectedToken` 与读取时一致才写入，防止静默覆盖。 */
  updateOutline(input) {
    this.#assertWritable('修改大纲')
    const id = Number(input?.outlineId)
    if (!Number.isFinite(id) || id <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 outlineId', {})
    const expectedToken = typeof input?.expectedToken === 'string' && input.expectedToken !== '' ? input.expectedToken : undefined
    let novelId = null
    this.#transaction(txn => {
      const current = txn.prepare('SELECT id, novel_id, chapter_id, title, content, updated_at FROM outlines WHERE id = ?').get(id)
      if (!current) throw new QibiError('OUTLINE_NOT_FOUND', `大纲不存在：${id}`, { outlineId: id })
      this.#assertOwnNovel(current.novel_id)
      this.#assertEntityToken(
        expectedToken,
        entityToken(current.updated_at, [current.id, current.chapter_id, current.title, current.content]),
        '这条大纲',
      )
      novelId = current.novel_id
      const fields = []
      const values = []
      if (typeof input?.title === 'string') { fields.push('title = ?'); values.push(input.title) }
      if (typeof input?.content === 'string') { fields.push('content = ?'); values.push(input.content) }
      if (input?.chapterId !== undefined) {
        fields.push('chapter_id = ?')
        values.push(input.chapterId == null ? null : this.#assertChapterInNovel(input.chapterId, current.novel_id))
      }
      if (fields.length === 0) throw new QibiError('BAD_ARGUMENT', '没有要修改的字段', {})
      fields.push("updated_at = datetime('now')")
      txn.prepare(`UPDATE outlines SET ${fields.join(', ')} WHERE id = ?`).run(...values, id)
      this.#indexOutline(txn, current.novel_id, id)
    })
    this.#bump()
    return { outline: this.outline(novelId) }
  }

  /** 删除大纲条目。 */
  deleteOutline(input) {
    this.#assertWritable('删除大纲')
    const id = Number(input?.outlineId)
    if (!Number.isFinite(id) || id <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 outlineId', {})
    const db = this.#open()
    const current = db.prepare('SELECT id, novel_id FROM outlines WHERE id = ?').get(id)
    if (!current) throw new QibiError('OUTLINE_NOT_FOUND', `大纲不存在：${id}`, { outlineId: id })
    this.#assertOwnNovel(current.novel_id)
    this.#transaction(txn => {
      txn.prepare('DELETE FROM outlines WHERE id = ?').run(id)
      this.#dropChunks(txn, current.novel_id, 'outline', id)
    })
    this.#bump()
    return { deleted: id, outline: this.outline(current.novel_id) }
  }

  // ---- 人物 ----

  /** 新建人物。 */
  createCharacter(input) {
    this.#assertWritable('新建人物')
    const novelId = this.#assertOwnNovel(input?.novelId)
    const name = typeof input?.name === 'string' ? input.name.trim() : ''
    if (!name) throw new QibiError('BAD_ARGUMENT', '人物名不能为空', {})
    const fields = { name, alias: '', role: '主要人物', gender: '未知', age: '', appearance: '', personality: '', background: '' }
    for (const key of Object.keys(fields)) {
      if (typeof input?.[key] === 'string') fields[key] = input[key]
    }
    const info = this.#transaction(txn => {
      const max = Number(txn.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM characters WHERE novel_id = ?').get(novelId)?.m ?? 0)
      const result = txn.prepare(
        'INSERT INTO characters (novel_id, name, alias, role, gender, age, appearance, personality, background, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(novelId, fields.name, fields.alias, fields.role, fields.gender, fields.age, fields.appearance, fields.personality, fields.background, max + 1)
      this.#indexCharacter(txn, novelId, Number(result.lastInsertRowid))
      return result
    })
    this.#bump()
    return { id: Number(info.lastInsertRowid), characters: this.characters(novelId) }
  }

  /** 修改人物。`expectedToken` 与读取时一致才写入。 */
  updateCharacter(input) {
    this.#assertWritable('修改人物')
    const id = Number(input?.characterId)
    if (!Number.isFinite(id) || id <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 characterId', {})
    const expectedToken = typeof input?.expectedToken === 'string' && input.expectedToken !== '' ? input.expectedToken : undefined
    let novelId = null
    this.#transaction(txn => {
      const current = txn.prepare('SELECT id, novel_id, name, alias, role, gender, age, appearance, personality, background, updated_at FROM characters WHERE id = ?').get(id)
      if (!current) throw new QibiError('CHARACTER_NOT_FOUND', `人物不存在：${id}`, { characterId: id })
      this.#assertOwnNovel(current.novel_id)
      this.#assertEntityToken(
        expectedToken,
        entityToken(current.updated_at, [
          current.id, current.name, current.alias, current.role, current.gender,
          current.age, current.appearance, current.personality, current.background,
        ]),
        '这个人物',
      )
      novelId = current.novel_id
      const columns = ['name', 'alias', 'role', 'gender', 'age', 'appearance', 'personality', 'background']
      const fields = []
      const values = []
      for (const column of columns) {
        if (typeof input?.[column] === 'string') { fields.push(`${column} = ?`); values.push(input[column]) }
      }
      if (fields.length === 0) throw new QibiError('BAD_ARGUMENT', '没有要修改的字段', {})
      fields.push("updated_at = datetime('now')")
      txn.prepare(`UPDATE characters SET ${fields.join(', ')} WHERE id = ?`).run(...values, id)
      this.#indexCharacter(txn, current.novel_id, id)
    })
    this.#bump()
    return { characters: this.characters(novelId) }
  }

  /** 删除人物。 */
  deleteCharacter(input) {
    this.#assertWritable('删除人物')
    const id = Number(input?.characterId)
    if (!Number.isFinite(id) || id <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 characterId', {})
    const db = this.#open()
    const current = db.prepare('SELECT id, novel_id FROM characters WHERE id = ?').get(id)
    if (!current) throw new QibiError('CHARACTER_NOT_FOUND', `人物不存在：${id}`, { characterId: id })
    this.#assertOwnNovel(current.novel_id)
    this.#transaction(txn => {
      txn.prepare('DELETE FROM characters WHERE id = ?').run(id)
      this.#dropChunks(txn, current.novel_id, 'character', id)
    })
    this.#bump()
    return { deleted: id, characters: this.characters(current.novel_id) }
  }

  /** 人物的动态账本（位置/境界/道具/近期事件）。 */
  characterState(characterId) {
    const id = Number(characterId)
    const db = this.#open()
    const character = db.prepare('SELECT novel_id FROM characters WHERE id = ?').get(id)
    if (!character) throw new QibiError('CHARACTER_NOT_FOUND', `人物不存在：${id}`, { characterId: id })
    this.#assertOwnNovel(character.novel_id)
    const row = db.prepare('SELECT * FROM character_states WHERE character_id = ?').get(id)
    if (!row) return { characterId: id, exists: false }
    const pick = key => (row[key] == null ? '' : String(row[key]))
    return {
      characterId: id,
      exists: true,
      location: pick('current_location'),
      realm: pick('current_realm'),
      inventory: pick('inventory'),
      statusEffects: pick('status_effects'),
      notes: pick('notes'),
      keyRelationships: pick('key_relationships'),
      recentEvents: pick('recent_events'),
      updatedAt: pick('updated_at'),
      token: entityToken(row.updated_at, [
        row.current_location, row.current_realm, row.inventory, row.status_effects,
        row.notes, row.key_relationships, row.recent_events,
      ]),
    }
  }

  /** 写入人物动态账本（不存在则创建）。 */
  updateCharacterState(input) {
    this.#assertWritable('更新人物状态')
    const id = Number(input?.characterId)
    if (!Number.isFinite(id) || id <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 characterId', {})
    const db = this.#open()
    const character = db.prepare('SELECT id, novel_id FROM characters WHERE id = ?').get(id)
    if (!character) throw new QibiError('CHARACTER_NOT_FOUND', `人物不存在：${id}`, { characterId: id })
    this.#assertOwnNovel(character.novel_id)
    const columns = {
      current_location: 'location', current_realm: 'realm', inventory: 'inventory',
      status_effects: 'statusEffects', notes: 'notes', key_relationships: 'keyRelationships', recent_events: 'recentEvents',
    }
    const available = this.#cols('character_states')
    const fields = []
    const values = []
    for (const [column, key] of Object.entries(columns)) {
      if (!available.has(column)) continue
      if (input?.[key] === undefined) continue
      fields.push(`${column} = ?`)
      values.push(String(input[key]))
    }
    if (fields.length === 0) throw new QibiError('BAD_ARGUMENT', '没有要修改的字段', {})
    const expectedToken = typeof input?.expectedToken === 'string' && input.expectedToken !== '' ? input.expectedToken : undefined
    const currentRow = db.prepare('SELECT * FROM character_states WHERE character_id = ?').get(id)
    if (currentRow) {
      this.#assertEntityToken(
        expectedToken,
        entityToken(currentRow.updated_at, [
          currentRow.current_location, currentRow.current_realm, currentRow.inventory,
          currentRow.status_effects, currentRow.notes, currentRow.key_relationships, currentRow.recent_events,
        ]),
        '这个人物账本',
      )
      fields.push("updated_at = datetime('now')")
      db.prepare(`UPDATE character_states SET ${fields.join(', ')} WHERE character_id = ?`).run(...values, id)
    } else {
      const insertColumns = ['character_id', 'novel_id']
      const insertValues = [id, character.novel_id]
      for (const field of fields) {
        insertColumns.push(field.replace(' = ?', ''))
      }
      db.prepare(`INSERT INTO character_states (${insertColumns.join(', ')}${available.has('updated_at') ? ', updated_at' : ''}) VALUES (${[...insertColumns].map(() => '?').join(', ')}${available.has('updated_at') ? ", datetime('now')" : ''})`).run(...insertValues, ...values)
    }
    this.#bump()
    return this.characterState(id)
  }

  // ---- 分卷 / 章节摘要 / 写作状态 ----

  /** 分卷列表（没有 volumes 表时返回空数组）。 */
  volumes(novelId) {
    const id = this.#assertOwnNovel(novelId)
    if (!this.#hasTable('volumes')) return []
    const rows = this.#open().prepare('SELECT id, title, summary, core_conflict, sort_order, updated_at FROM volumes WHERE novel_id = ? ORDER BY sort_order, id').all(id)
    return rows.map(row => ({
      id: Number(row.id),
      title: String(row.title ?? ''),
      summary: String(row.summary ?? ''),
      coreConflict: String(row.core_conflict ?? ''),
      order: Number(row.sort_order ?? 0),
      token: entityToken(row.updated_at, [row.id, row.title, row.summary, row.core_conflict]),
    }))
  }

  /** 新建分卷。 */
  createVolume(input) {
    this.#assertWritable('新建分卷')
    const novelId = this.#assertOwnNovel(input?.novelId)
    if (!this.#hasTable('volumes')) throw new QibiError('NO_VOLUMES', '这个起笔数据库还没有分卷表', {})
    const title = typeof input?.title === 'string' ? input.title.trim() : ''
    if (!title) throw new QibiError('BAD_ARGUMENT', '分卷名不能为空', {})
    const db = this.#open()
    const max = Number(db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM volumes WHERE novel_id = ?').get(novelId)?.m ?? 0)
    db.prepare('INSERT INTO volumes (novel_id, title, summary, core_conflict, sort_order) VALUES (?, ?, ?, ?, ?)').run(
      novelId, title, typeof input?.summary === 'string' ? input.summary : '', typeof input?.coreConflict === 'string' ? input.coreConflict : '', max + 1,
    )
    this.#bump()
    return { volumes: this.volumes(novelId) }
  }

  /** 修改分卷。`expectedToken` 与读取时一致才写入。 */
  updateVolume(input) {
    this.#assertWritable('修改分卷')
    const id = Number(input?.volumeId)
    if (!Number.isFinite(id) || id <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 volumeId', {})
    const expectedToken = typeof input?.expectedToken === 'string' && input.expectedToken !== '' ? input.expectedToken : undefined
    let novelId = null
    this.#transaction(txn => {
      const current = txn.prepare('SELECT id, novel_id, title, summary, core_conflict, updated_at FROM volumes WHERE id = ?').get(id)
      if (!current) throw new QibiError('VOLUME_NOT_FOUND', `分卷不存在：${id}`, { volumeId: id })
      this.#assertOwnNovel(current.novel_id)
      this.#assertEntityToken(
        expectedToken,
        entityToken(current.updated_at, [current.id, current.title, current.summary, current.core_conflict]),
        '这个分卷',
      )
      novelId = current.novel_id
      const map = { title: 'title', summary: 'summary', coreConflict: 'core_conflict' }
      const fields = []
      const values = []
      for (const [key, column] of Object.entries(map)) {
        if (typeof input?.[key] !== 'string') continue
        fields.push(`${column} = ?`)
        values.push(input[key])
      }
      if (fields.length === 0) throw new QibiError('BAD_ARGUMENT', '没有要修改的字段', {})
      fields.push("updated_at = datetime('now')")
      txn.prepare(`UPDATE volumes SET ${fields.join(', ')} WHERE id = ?`).run(...values, id)
    })
    this.#bump()
    return { volumes: this.volumes(novelId) }
  }

  /** 章节微摘要与前情提要。 */
  chapterSummary(chapterId) {
    const id = Number(chapterId)
    this.chapter(id)
    const row = this.#open().prepare('SELECT chapter_id, summary, key_events, cliffhanger, updated_at FROM chapter_summaries WHERE chapter_id = ?').get(id)
    if (!row) return { chapterId: id, exists: false }
    return {
      chapterId: id,
      exists: true,
      summary: String(row.summary ?? ''),
      keyEvents: String(row.key_events ?? ''),
      cliffhanger: String(row.cliffhanger ?? ''),
      updatedAt: String(row.updated_at ?? ''),
      token: entityToken(row.updated_at, [row.summary, row.key_events, row.cliffhanger]),
    }
  }

  /** 写入章节微摘要。 */
  upsertChapterSummary(input) {
    this.#assertWritable('写入章节摘要')
    const chapterId = Number(input?.chapterId)
    if (!Number.isFinite(chapterId)) throw new QibiError('BAD_ARGUMENT', '缺少有效的 chapterId', {})
    const chapter = this.chapter(chapterId)
    const db = this.#open()
    const expectedToken = typeof input?.expectedToken === 'string' && input.expectedToken !== '' ? input.expectedToken : undefined
    const existing = db.prepare('SELECT summary, key_events, cliffhanger, updated_at FROM chapter_summaries WHERE chapter_id = ?').get(chapterId)
    const values = [
      typeof input?.summary === 'string' ? input.summary : '',
      typeof input?.keyEvents === 'string' ? input.keyEvents : '',
      typeof input?.cliffhanger === 'string' ? input.cliffhanger : '',
    ]
    if (existing) {
      this.#assertEntityToken(
        expectedToken,
        entityToken(existing.updated_at, [existing.summary, existing.key_events, existing.cliffhanger]),
        '这一章的摘要',
      )
      db.prepare("UPDATE chapter_summaries SET summary = ?, key_events = ?, cliffhanger = ?, updated_at = datetime('now') WHERE chapter_id = ?").run(...values, chapterId)
    } else {
      db.prepare("INSERT INTO chapter_summaries (chapter_id, novel_id, summary, key_events, cliffhanger, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))").run(chapterId, chapter.novelId, ...values)
    }
    this.#bump()
    return this.chapterSummary(chapterId)
  }

  /** 作品的写作状态（进度 + 伏笔账本）。 */
  writerState(novelId) {
    const id = this.#assertOwnNovel(novelId)
    const row = this.#open().prepare('SELECT progress, foreshadowing, distilled_author_id, updated_at FROM novel_writer_state WHERE novel_id = ?').get(id)
    if (!row) return { novelId: id, exists: false, progress: '', foreshadowing: '[]', distilledAuthorId: null }
    return {
      novelId: id,
      exists: true,
      progress: String(row.progress ?? ''),
      foreshadowing: String(row.foreshadowing ?? '[]'),
      distilledAuthorId: row.distilled_author_id == null ? null : Number(row.distilled_author_id),
      updatedAt: String(row.updated_at ?? ''),
      token: entityToken(row.updated_at, [row.progress, row.foreshadowing, row.distilled_author_id]),
    }
  }

  /** 写入写作状态。 */
  updateWriterState(input) {
    this.#assertWritable('更新写作状态')
    const novelId = this.#assertOwnNovel(input?.novelId)
    const user = this.user()
    if (!user) throw new QibiError('NO_USER', '起笔里还没有可用用户', {})
    const db = this.#open()
    const expectedToken = typeof input?.expectedToken === 'string' && input.expectedToken !== '' ? input.expectedToken : undefined
    const existing = db.prepare('SELECT progress, foreshadowing, distilled_author_id, updated_at FROM novel_writer_state WHERE novel_id = ?').get(novelId)
    if (existing) {
      this.#assertEntityToken(
        expectedToken,
        entityToken(existing.updated_at, [existing.progress, existing.foreshadowing, existing.distilled_author_id]),
        '这部作品的写作状态',
      )
      const fields = []
      const values = []
      if (typeof input?.progress === 'string') { fields.push('progress = ?'); values.push(input.progress) }
      if (typeof input?.foreshadowing === 'string') { fields.push('foreshadowing = ?'); values.push(input.foreshadowing) }
      if (input?.distilledAuthorId !== undefined) { fields.push('distilled_author_id = ?'); values.push(input.distilledAuthorId == null ? null : Number(input.distilledAuthorId)) }
      if (fields.length === 0) throw new QibiError('BAD_ARGUMENT', '没有要修改的字段', {})
      fields.push("updated_at = datetime('now')")
      db.prepare(`UPDATE novel_writer_state SET ${fields.join(', ')} WHERE novel_id = ?`).run(...values, novelId)
    } else {
      db.prepare(
        'INSERT INTO novel_writer_state (novel_id, user_id, distilled_author_id, progress, foreshadowing) VALUES (?, ?, ?, ?, ?)',
      ).run(novelId, user.id, input?.distilledAuthorId == null ? null : Number(input.distilledAuthorId), typeof input?.progress === 'string' ? input.progress : '', typeof input?.foreshadowing === 'string' ? input.foreshadowing : '[]')
    }
    this.#bump()
    return this.writerState(novelId)
  }

  // ---- 检索（起笔自带 BM25） ----

  /**
   * 用起笔自己的 BM25 检索知识库（`kb_chunks`）。
   * 与 `server/src/kb.ts` 的 `query()` 同一套分词与打分，因此结果与起笔一致。
   * @param {number} novelId 作品 id。
   * @param {string} queryText 查询串。
   * @param {number} [limit] 返回条数，默认 5。
   */
  kbQuery(novelId, queryText, limit = 5) {
    const id = this.#assertOwnNovel(novelId)
    if (!this.#hasTable('kb_chunks')) return []
    const qTokens = tokenize(queryText)
    if (qTokens.length === 0) return []
    const qSet = new Set(qTokens)
    const chunks = this.#open().prepare('SELECT id, source_kind, source_id, title, content FROM kb_chunks WHERE novel_id = ?').all(id)
    if (chunks.length === 0) return []
    const N = chunks.length
    const avgLen = chunks.reduce((sum, chunk) => sum + String(chunk.content ?? '').length, 0) / N || 1
    const df = new Map()
    const tfs = chunks.map(chunk => {
      const toks = tokenize(String(chunk.content ?? ''))
      const tf = new Map()
      for (const token of toks) tf.set(token, (tf.get(token) ?? 0) + 1)
      for (const token of tf.keys()) df.set(token, (df.get(token) ?? 0) + 1)
      return { chunk, tf, len: toks.length }
    })
    const K1 = 1.5
    const B = 0.75
    const idf = token => Math.log(1 + (N - (df.get(token) ?? 0) + 0.5) / ((df.get(token) ?? 0) + 0.5))
    const scored = []
    for (const { chunk, tf, len } of tfs) {
      let score = 0
      for (const token of qSet) {
        const f = tf.get(token) ?? 0
        if (!f) continue
        score += idf(token) * ((f * (K1 + 1)) / (f + K1 * (1 - B + B * (len / avgLen))))
      }
      if (score > 0) {
        scored.push({
          kind: String(chunk.source_kind ?? ''),
          sourceId: chunk.source_id == null ? null : Number(chunk.source_id),
          title: String(chunk.title ?? ''),
          content: String(chunk.content ?? ''),
          score: Number(score.toFixed(4)),
        })
      }
    }
    const max = Math.max(1, Math.min(20, Number(limit) || 5))
    return scored.sort((a, b) => b.score - a.score).slice(0, max)
  }

  /** 知识库统计。 */
  kbStats(novelId) {
    const id = this.#assertOwnNovel(novelId)
    if (!this.#hasTable('kb_chunks')) return { chunks: 0, lastIndexed: null }
    const row = this.#open().prepare('SELECT COUNT(*) AS c, MAX(indexed_at) AS last_indexed FROM kb_chunks WHERE novel_id = ?').get(id)
    return { chunks: Number(row?.c ?? 0), lastIndexed: row?.last_indexed == null ? null : String(row.last_indexed) }
  }

  /** 整本重建知识库（等价于起笔的 indexNovel：章节 + 大纲 + 人物）。 */
  reindexNovel(novelId) {
    this.#assertWritable('重建知识库')
    const id = this.#assertOwnNovel(novelId)
    if (!this.#hasTable('kb_chunks')) throw new QibiError('NO_KB', '这个起笔数据库还没有知识库表', {})
    const db = this.#open()
    const chapters = db.prepare('SELECT id FROM chapters WHERE novel_id = ? ORDER BY sort_order, id').all(id)
    const outlines = db.prepare('SELECT id, title, content, chapter_id FROM outlines WHERE novel_id = ?').all(id)
    const characters = db.prepare('SELECT id, name, alias, role, gender, personality, appearance, background FROM characters WHERE novel_id = ?').all(id)
    this.#transaction(txn => {
      txn.prepare('DELETE FROM kb_chunks WHERE novel_id = ?').run(id)
      for (const chapter of chapters) this.#reindexChapter(txn, id, Number(chapter.id))
      const insert = txn.prepare('INSERT INTO kb_chunks (novel_id, source_kind, source_id, title, content) VALUES (?, ?, ?, ?, ?)')
      for (const outline of outlines) {
        const body = `【${outline.chapter_id ? '本章细纲' : '总纲'}】${outline.title}\n${outline.content || ''}`.trim()
        if (!body) continue
        insert.run(id, 'outline', Number(outline.id), String(outline.title ?? ''), body)
      }
      for (const character of characters) {
        const body = `【人物】${character.name}${character.alias ? `（${character.alias}）` : ''} ${character.role || ''}\n${[
          character.gender ? `性别：${character.gender}` : '',
          character.personality ? `性格：${character.personality}` : '',
          character.appearance ? `外貌：${character.appearance}` : '',
          character.background ? `背景：${character.background}` : '',
        ].filter(Boolean).join('\n')}`
        insert.run(id, 'character', Number(character.id), String(character.name ?? ''), body)
      }
    })
    this.#bump()
    return this.kbStats(id)
  }

  // ---- 蒸馏作者 ----

  /** 当前作者的蒸馏作者列表。 */
  distilledAuthors() {
    const user = this.user()
    if (!user) return []
    return this.#open().prepare('SELECT * FROM distilled_authors WHERE user_id = ? ORDER BY updated_at DESC, id DESC').all(user.id)
      .map(row => this.#publicDistilledAuthor(row))
  }

  /** 单个蒸馏作者（含素材与版本）。 */
  distilledAuthor(authorId) {
    const author = this.#assertOwnDistilledAuthor(authorId)
    const db = this.#open()
    const sources = db.prepare('SELECT * FROM distilled_author_sources WHERE author_id = ? ORDER BY created_at DESC, id DESC').all(author.id)
    const versions = db.prepare('SELECT * FROM distilled_author_versions WHERE author_id = ? ORDER BY version DESC').all(author.id)
    return {
      ...this.#publicDistilledAuthor(author),
      sources: sources.map(publicDistillSource),
      versions: versions.map(publicDistillVersion),
    }
  }

  /** 新建蒸馏作者。 */
  createDistilledAuthor(input) {
    this.#assertWritable('新建蒸馏作者')
    const name = typeof input?.name === 'string' ? input.name.trim() : ''
    if (!name) throw new QibiError('BAD_ARGUMENT', '作者名称不能为空', {})
    const user = this.user()
    if (!user) throw new QibiError('NO_USER', '起笔里还没有可用用户', {})
    const slug = slugifyAuthor(input?.slug ?? name)
    const profile = typeof input?.profile === 'string' ? input.profile : JSON.stringify(input?.profile ?? {})
    let info
    try {
      info = this.#open().prepare('INSERT INTO distilled_authors (user_id, name, slug, profile) VALUES (?, ?, ?, ?)').run(user.id, name, slug, profile)
    } catch (error) {
      if (String(error?.message).includes('UNIQUE')) throw new QibiError('AUTHOR_EXISTS', '同名作者已经存在', { name })
      throw error
    }
    this.#bump()
    return this.#publicDistilledAuthor(this.#assertOwnDistilledAuthor(Number(info.lastInsertRowid)))
  }

  /** 修改蒸馏作者名称/画像。 */
  updateDistilledAuthor(input) {
    this.#assertWritable('修改蒸馏作者')
    const author = this.#assertOwnDistilledAuthor(input?.authorId)
    const name = input?.name === undefined ? author.name : String(input.name).trim()
    if (!name) throw new QibiError('BAD_ARGUMENT', '作者名称不能为空', {})
    const profile = input?.profile === undefined
      ? author.profile
      : (typeof input.profile === 'string' ? input.profile : JSON.stringify(input.profile ?? {}))
    this.#open().prepare("UPDATE distilled_authors SET name = ?, profile = ?, updated_at = datetime('now') WHERE id = ?").run(name, profile, author.id)
    this.#bump()
    return this.#publicDistilledAuthor(this.#assertOwnDistilledAuthor(author.id))
  }

  /** 删除蒸馏作者及其素材文件；同时解除作品上的绑定。 */
  deleteDistilledAuthor(input) {
    this.#assertWritable('删除蒸馏作者')
    const author = this.#assertOwnDistilledAuthor(input?.authorId)
    const db = this.#open()
    const sources = db.prepare('SELECT stored_path FROM distilled_author_sources WHERE author_id = ?').all(author.id)
    db.prepare('UPDATE novel_writer_state SET distilled_author_id = NULL WHERE distilled_author_id = ?').run(author.id)
    db.prepare('DELETE FROM distilled_authors WHERE id = ?').run(author.id)
    for (const source of sources) {
      this.#unlink(source.stored_path)
      this.#unlink(this.#samplePath(source.stored_path))
    }
    this.#bump()
    return { deleted: author.id }
  }

  /** 初始化一个分块上传任务。 */
  initDistilledSource(input) {
    this.#assertWritable('上传蒸馏素材')
    const author = this.#assertOwnDistilledAuthor(input?.authorId)
    const user = this.user()
    const filename = path.basename(String(input?.filename || '材料.txt')).slice(0, 255)
    const ext = path.extname(filename).slice(1).toLowerCase()
    const format = String(input?.format || ext || 'txt').toLowerCase()
    if (!DISTILL_FORMATS.has(format)) throw new QibiError('BAD_ARGUMENT', '仅支持 TXT、EPUB、Markdown、HTML 或 JSON 材料', { format })
    const expectedSize = Number(input?.sizeBytes ?? input?.size ?? 0)
    if (!Number.isSafeInteger(expectedSize) || expectedSize <= 0 || expectedSize > DISTILL_MAX_SOURCE_BYTES) {
      throw new QibiError('BAD_ARGUMENT', '材料大小必须在 1B 到 100MB 之间', {})
    }
    const dir = this.#distillDir(user.id, author.id)
    fs.mkdirSync(dir, { recursive: true })
    const storedPath = path.join(dir, `${crypto.randomUUID()}${ext ? `.${ext}` : '.txt'}`)
    fs.writeFileSync(storedPath, Buffer.alloc(0))
    const info = this.#open().prepare(
      `INSERT INTO distilled_author_sources (author_id, user_id, kind, filename, format, stored_path, size_bytes, status)
       VALUES (?, ?, ?, ?, ?, ?, 0, 'uploading')`,
    ).run(author.id, user.id, String(input?.kind || 'novel'), filename, format, storedPath)
    return { sourceId: Number(info.lastInsertRowid), filename, format, expectedSize }
  }

  /** 追加一个分块（base64）。 */
  appendDistilledSource(input) {
    this.#assertWritable('上传蒸馏素材')
    const source = this.#sourceForUser(input?.sourceId)
    if (source.status !== 'uploading') throw new QibiError('UPLOAD_CLOSED', '该上传任务已结束', { sourceId: source.id })
    const chunk = Buffer.from(String(input?.base64 ?? ''), 'base64')
    if (!chunk.length) throw new QibiError('BAD_ARGUMENT', '上传分块为空', {})
    if (chunk.length > 8 * 1024 * 1024) throw new QibiError('BAD_ARGUMENT', '上传分块过大', {})
    const current = fs.existsSync(source.stored_path) ? fs.statSync(source.stored_path).size : 0
    const offset = input?.offset === undefined || input?.offset === null ? current : Number(input.offset)
    if (!Number.isSafeInteger(offset) || offset !== current) {
      throw new QibiError('UPLOAD_OFFSET', `上传位置不匹配，当前应为 ${current}`, { expected: current })
    }
    if (current + chunk.length > DISTILL_MAX_SOURCE_BYTES) throw new QibiError('SOURCE_TOO_LARGE', '材料不能超过 100MB', {})
    fs.appendFileSync(source.stored_path, chunk)
    const size = current + chunk.length
    this.#open().prepare('UPDATE distilled_author_sources SET size_bytes = ? WHERE id = ?').run(size, source.id)
    return { sourceId: source.id, received: size }
  }

  /** 完成上传：解析并写入样本文本。 */
  async completeDistilledSource(input) {
    this.#assertWritable('解析蒸馏素材')
    const source = this.#sourceForUser(input?.sourceId)
    try {
      const stat = fs.statSync(source.stored_path)
      if (!stat.size) throw new Error('材料为空')
      const result = await parseSourceFile(source.stored_path, source.format)
      fs.writeFileSync(this.#samplePath(source.stored_path), result.sample, 'utf8')
      this.#open().prepare(
        `UPDATE distilled_author_sources
            SET size_bytes = ?, parsed_chars = ?, chapter_count = ?, status = 'ready', error = NULL
          WHERE id = ?`,
      ).run(stat.size, result.chars, result.chapters, source.id)
      this.#bump()
      return publicDistillSource(this.#open().prepare('SELECT * FROM distilled_author_sources WHERE id = ?').get(source.id))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.#open().prepare("UPDATE distilled_author_sources SET status = 'error', error = ? WHERE id = ?").run(message, source.id)
      throw new QibiError('SOURCE_PARSE_FAILED', message, { sourceId: source.id })
    }
  }

  /** 直接追加一段粘贴的文本素材。 */
  async addDistilledText(input) {
    this.#assertWritable('添加蒸馏素材')
    const author = this.#assertOwnDistilledAuthor(input?.authorId)
    const user = this.user()
    const text = typeof input?.text === 'string' ? input.text : ''
    if (!text.trim()) throw new QibiError('BAD_ARGUMENT', '素材内容不能为空', {})
    const size = Buffer.byteLength(text, 'utf8')
    if (size > DISTILL_MAX_SOURCE_BYTES) throw new QibiError('SOURCE_TOO_LARGE', '材料不能超过 100MB', {})
    const filename = path.basename(String(input?.filename || '粘贴材料.txt')).slice(0, 255)
    const ext = path.extname(filename).slice(1).toLowerCase()
    const format = DISTILL_FORMATS.has(ext) && ext !== 'epub' ? ext : 'txt'
    const dir = this.#distillDir(user.id, author.id)
    fs.mkdirSync(dir, { recursive: true })
    const storedPath = path.join(dir, `${crypto.randomUUID()}.${format}`)
    fs.writeFileSync(storedPath, text, 'utf8')
    const result = await parseSourceFile(storedPath, format)
    fs.writeFileSync(this.#samplePath(storedPath), result.sample, 'utf8')
    const info = this.#open().prepare(
      `INSERT INTO distilled_author_sources
        (author_id, user_id, kind, filename, format, stored_path, size_bytes, parsed_chars, chapter_count, status, error)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready', NULL)`,
    ).run(author.id, user.id, String(input?.kind || 'novel'), filename, format, storedPath, size, result.chars, result.chapters)
    this.#bump()
    return publicDistillSource(this.#open().prepare('SELECT * FROM distilled_author_sources WHERE id = ?').get(info.lastInsertRowid))
  }

  /** 删除一份素材及其文件。 */
  deleteDistilledSource(input) {
    this.#assertWritable('删除蒸馏素材')
    const source = this.#sourceForUser(input?.sourceId)
    this.#unlink(source.stored_path)
    this.#unlink(this.#samplePath(source.stored_path))
    this.#open().prepare('DELETE FROM distilled_author_sources WHERE id = ?').run(source.id)
    this.#bump()
    return { deleted: source.id }
  }

  /** 汇总素材样本、上一版本与三段提示词，供 DSH Agent 生成。 */
  async distilledMaterial(authorId) {
    const author = this.#assertOwnDistilledAuthor(authorId)
    const db = this.#open()
    const rows = db.prepare(
      "SELECT * FROM distilled_author_sources WHERE author_id = ? AND user_id = ? AND status = 'ready' ORDER BY created_at, id",
    ).all(author.id, author.user_id)
    if (!rows.length) throw new QibiError('NO_SOURCES', '请先上传并解析至少一份材料', { authorId: author.id })

    const blocks = []
    const sources = []
    let total = 0
    for (const row of rows) {
      let sample = ''
      const sidecar = this.#samplePath(row.stored_path)
      try {
        if (fs.existsSync(sidecar)) {
          sample = fs.readFileSync(sidecar, 'utf8')
        } else {
          const parsed = await parseSourceFile(row.stored_path, row.format)
          sample = parsed.sample
          if (this.writable) {
            try {
              fs.writeFileSync(sidecar, sample, 'utf8')
            } catch {
              // 源目录不可写时只影响缓存，不影响本次读取。
            }
          }
        }
      } catch (error) {
        sample = `（素材 ${row.filename} 读取失败：${error instanceof Error ? error.message : String(error)}）`
      }
      const block = `\n\n===== 材料：${row.filename} =====\n${sample}`
      if (total + block.length > 200_000) break
      blocks.push(block)
      total += block.length
      sources.push({
        id: Number(row.id),
        filename: String(row.filename ?? ''),
        format: String(row.format ?? ''),
        chars: Number(row.parsed_chars ?? 0),
        chapters: Number(row.chapter_count ?? 0),
        sampleChars: sample.length,
      })
    }
    const previousRow = author.current_version_id == null
      ? null
      : db.prepare('SELECT * FROM distilled_author_versions WHERE id = ?').get(author.current_version_id)
    return {
      author: this.#publicDistilledAuthor(author),
      sources,
      material: blocks.join('').trim(),
      previous: previousRow ? publicDistillVersion(previousRow) : null,
      previousContext: previousRow
        ? `\n\n【上一版本 writing skill】\n${String(previousRow.writing_skill ?? '').slice(0, 12_000)}\n\n【上一版本 author persona】\n${String(previousRow.author_persona ?? '').slice(0, 8_000)}`
        : '',
      prompts: DISTILL_PROMPTS,
    }
  }

  /** 保存一次蒸馏结果为新版本，并设为当前版本。 */
  saveDistilledVersion(input) {
    this.#assertWritable('保存蒸馏版本')
    const author = this.#assertOwnDistilledAuthor(input?.authorId)
    const user = this.user()
    const writingSkill = typeof input?.writingSkill === 'string' ? input.writingSkill : ''
    const authorPersona = typeof input?.authorPersona === 'string' ? input.authorPersona : ''
    const skillMarkdown = typeof input?.skillMarkdown === 'string' ? input.skillMarkdown : ''
    const sampleSummary = typeof input?.sampleSummary === 'string' ? input.sampleSummary : ''
    if (!skillMarkdown.trim()) throw new QibiError('BAD_ARGUMENT', 'skillMarkdown 不能为空', {})
    if ([writingSkill, authorPersona, skillMarkdown, sampleSummary].some(value => value.length > 400_000)) {
      throw new QibiError('CONTENT_TOO_LONG', '单个字段超过 40 万字符上限', {})
    }
    const db = this.#open()
    const nextVersion = Number(db.prepare('SELECT MAX(version) AS v FROM distilled_author_versions WHERE author_id = ?').get(author.id)?.v ?? 0) + 1
    const info = db.prepare(
      `INSERT INTO distilled_author_versions
        (author_id, user_id, version, writing_skill, author_persona, skill_markdown, sample_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(author.id, user.id, nextVersion, writingSkill, authorPersona, skillMarkdown, sampleSummary)
    db.prepare("UPDATE distilled_authors SET current_version_id = ?, status = 'ready', updated_at = datetime('now') WHERE id = ?").run(info.lastInsertRowid, author.id)
    this.#bump()
    const version = db.prepare('SELECT * FROM distilled_author_versions WHERE id = ?').get(info.lastInsertRowid)
    return {
      author: this.#publicDistilledAuthor(this.#assertOwnDistilledAuthor(author.id)),
      version: publicDistillVersion(version),
    }
  }

  /** 版本列表。 */
  distilledVersions(authorId) {
    const author = this.#assertOwnDistilledAuthor(authorId)
    return this.#open().prepare('SELECT * FROM distilled_author_versions WHERE author_id = ? ORDER BY version DESC').all(author.id)
      .map(publicDistillVersion)
  }

  /** 回滚到指定版本。 */
  rollbackDistilledVersion(input) {
    this.#assertWritable('回滚蒸馏版本')
    const author = this.#assertOwnDistilledAuthor(input?.authorId)
    const versionId = Number(input?.versionId)
    if (!Number.isFinite(versionId) || versionId <= 0) throw new QibiError('BAD_ARGUMENT', '缺少有效的 versionId', {})
    const version = this.#open().prepare('SELECT * FROM distilled_author_versions WHERE id = ? AND author_id = ?').get(versionId, author.id)
    if (!version) throw new QibiError('VERSION_NOT_FOUND', `版本不存在：${versionId}`, { versionId })
    this.#open().prepare("UPDATE distilled_authors SET current_version_id = ?, status = 'ready', updated_at = datetime('now') WHERE id = ?").run(versionId, author.id)
    this.#bump()
    return this.#publicDistilledAuthor(this.#assertOwnDistilledAuthor(author.id))
  }

  /** 把蒸馏作者绑定到作品（或传 null 解除）。 */
  bindDistilledAuthor(input) {
    this.#assertWritable('绑定蒸馏作者')
    const novelId = this.#assertOwnNovel(input?.novelId)
    const authorId = input?.authorId == null ? null : this.#assertOwnDistilledAuthor(input.authorId).id
    const writerState = this.updateWriterState({ novelId, distilledAuthorId: authorId })
    return { writerState }
  }

  /** 当前选中作品启用的蒸馏作者 Skill，注入系统提示。 */
  distilledStyleLine() {
    try {
      const novelId = this.selection.novelId
      if (novelId == null) return ''
      const row = this.#open().prepare(
        `SELECT a.name AS name, v.version AS version, v.skill_markdown AS skill
           FROM novel_writer_state ws
           JOIN distilled_authors a ON a.id = ws.distilled_author_id
           JOIN distilled_author_versions v ON v.id = a.current_version_id
          WHERE ws.novel_id = ?`,
      ).get(novelId)
      if (!row || !String(row.skill ?? '').trim()) return ''
      return `起笔：当前作品启用了蒸馏作者《${row.name}》v${row.version}。以下是其写作 Skill，生成/润色正文时必须遵循：\n${String(row.skill).slice(0, 12_000)}`
    } catch {
      return ''
    }
  }

  // ---- 导出 ----

  /**
   * 导出整本（Markdown / TXT），返回文本而不是落盘：
   * 落盘交给 DSH 的文件工具，插件不擅自决定路径。
   * @param {{ novelId:number, format?:'markdown'|'txt', onlyPublished?:boolean }} input
   */
  exportNovel(input) {
    const novelId = this.#assertOwnNovel(input?.novelId)
    const format = input?.format === 'txt' ? 'txt' : 'markdown'
    const db = this.#open()
    const novel = db.prepare('SELECT title, author, genre, status, intro FROM novels WHERE id = ?').get(novelId)
    const rows = db.prepare('SELECT id, title, status, content, word_count FROM chapters WHERE novel_id = ? ORDER BY sort_order, id').all(novelId)
    const chapters = rows.filter(row => (input?.onlyPublished === true ? row.status === '已发布' : true))
    const parts = []
    if (format === 'markdown') {
      parts.push(`# ${novel.title}`)
      if (novel.author) parts.push(`作者：${novel.author}`)
      parts.push(`${novel.genre} · ${novel.status}`)
      if (novel.intro) parts.push('', novel.intro)
      for (const chapter of chapters) parts.push('', `## ${chapter.title}`, '', String(chapter.content ?? ''))
    } else {
      parts.push(String(novel.title))
      if (novel.author) parts.push(`作者：${novel.author}`)
      parts.push('')
      for (const chapter of chapters) parts.push('', String(chapter.title), '', String(chapter.content ?? ''))
    }
    const content = `${parts.join('\n')}\n`
    const safeTitle = String(novel.title).replace(/[\\/:*?"<>|]/g, '_')
    return {
      title: String(novel.title),
      filename: `${safeTitle}.${format === 'markdown' ? 'md' : 'txt'}`,
      format,
      chapters: chapters.length,
      wordCount: chapters.reduce((sum, chapter) => sum + Number(chapter.word_count ?? 0), 0),
      content,
    }
  }
}
function snippetAround(text, query, radius = 60) {
  const index = text.indexOf(query)
  if (index < 0) return text.slice(0, Math.min(120, text.length))
  const start = Math.max(0, index - radius)
  const end = Math.min(text.length, index + query.length + radius)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

/** 把内部错误收敛成可跨 RPC 传输的形状。 */
export function toPublicError(error) {
  if (error instanceof QibiError) {
    return { code: error.code, message: error.message, details: error.details ?? {} }
  }
  const message = error instanceof Error ? error.message : String(error)
  // 起笔与 DSH 同时写库时最常见的就是锁等待超时：给出可操作的提示，而不是 SQLite 原文。
  if (/database is locked|database table is locked|SQLITE_BUSY/i.test(message)) {
    return {
      code: 'DB_BUSY',
      message: '起笔正在占用数据库（写锁），请稍后重试；如果起笔正在导入或编辑大文件，可以先等它完成或临时关闭起笔。',
      details: { original: message },
    }
  }
  return {
    code: 'INTERNAL',
    message,
    details: {},
  }
}

export { CHAPTER_STATUSES }
