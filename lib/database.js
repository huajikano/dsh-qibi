/**
 * Empty standalone QiBi database bootstrap; no server/frontend runtime is imported.
 * Schema adapted from QiBi server/src/db.ts, including its startup migration columns.
 *
 * MIT License
 * Copyright (c) 2026 NovelForge (起笔) Contributors
 * Copyright (c) 2026 huajikano
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

// Historic databases may omit optional domain tables / migration columns. Check
// only the core columns that QibiStore needs without its optional-column guards.
const REQUIRED_COLUMNS = {
  users: ['id', 'username', 'role', 'disabled'],
  novels: ['id', 'user_id', 'title', 'author', 'genre', 'status', 'word_count', 'updated_at'],
  chapters: ['id', 'novel_id', 'title', 'content', 'status', 'word_count', 'sort_order', 'updated_at'],
}

// New files receive the complete current domain schema in one transaction.
// This string is never executed against a pre-existing database.
const EMPTY_SCHEMA = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'author',
  ai_api_key_enc TEXT,
  ai_api_key_enabled INTEGER DEFAULT 0,
  ai_api_base_url TEXT,
  ai_api_protocol TEXT NOT NULL DEFAULT 'auto',
  ai_api_model TEXT,
  ai_api_thinking TEXT NOT NULL DEFAULT 'auto',
  distill_api_key_enc TEXT,
  distill_api_key_enabled INTEGER DEFAULT 0,
  distill_api_base_url TEXT,
  distill_api_protocol TEXT NOT NULL DEFAULT 'auto',
  distill_api_model TEXT,
  distill_api_thinking TEXT NOT NULL DEFAULT 'auto',
  world_api_key_enc TEXT,
  world_api_key_enabled INTEGER DEFAULT 0,
  world_api_base_url TEXT,
  world_api_protocol TEXT NOT NULL DEFAULT 'auto',
  world_api_model TEXT,
  world_api_thinking TEXT NOT NULL DEFAULT 'auto',
  agent_api_key_enc TEXT,
  agent_api_key_enabled INTEGER DEFAULT 0,
  agent_api_base_url TEXT,
  agent_api_protocol TEXT NOT NULL DEFAULT 'auto',
  agent_api_model TEXT,
  agent_api_thinking TEXT NOT NULL DEFAULT 'auto',
  disabled INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  ai_custom_prompts TEXT DEFAULT '{}',
  registered_from_ip TEXT DEFAULT ''
);

CREATE TABLE novels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  genre TEXT NOT NULL DEFAULT '玄幻',
  status TEXT NOT NULL DEFAULT '连载中',
  intro TEXT NOT NULL DEFAULT '',
  cover_color TEXT NOT NULL DEFAULT '#e60012',
  word_count INTEGER NOT NULL DEFAULT 0,
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE volumes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  core_conflict TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '草稿',
  word_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  volume_id INTEGER REFERENCES volumes(id) ON DELETE SET NULL
);

CREATE TABLE outlines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  alias TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '主角',
  gender TEXT NOT NULL DEFAULT '未知',
  age TEXT NOT NULL DEFAULT '',
  appearance TEXT NOT NULL DEFAULT '',
  personality TEXT NOT NULL DEFAULT '',
  background TEXT NOT NULL DEFAULT '',
  relationships TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE maps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '世界地图',
  data TEXT NOT NULL DEFAULT '{}',
  thumbnail TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE distilled_authors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  profile TEXT NOT NULL DEFAULT '{}',
  current_version_id INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, slug)
);

CREATE TABLE distilled_author_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL REFERENCES distilled_authors(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'novel',
  filename TEXT NOT NULL,
  format TEXT NOT NULL,
  stored_path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  parsed_chars INTEGER NOT NULL DEFAULT 0,
  chapter_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'uploaded',
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE distilled_author_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL REFERENCES distilled_authors(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  writing_skill TEXT NOT NULL DEFAULT '',
  author_persona TEXT NOT NULL DEFAULT '',
  skill_markdown TEXT NOT NULL DEFAULT '',
  sample_summary TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(author_id, version)
);

CREATE TABLE chapter_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT '修改前备份',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE novel_writer_state (
  novel_id INTEGER PRIMARY KEY REFERENCES novels(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  distilled_author_id INTEGER,
  progress TEXT NOT NULL DEFAULT '',
  foreshadowing TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE kb_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  source_kind TEXT NOT NULL,
  source_id INTEGER,
  title TEXT,
  content TEXT NOT NULL,
  indexed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE user_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'writer',
  source_kind TEXT NOT NULL DEFAULT 'manual',
  source_ref TEXT,
  content TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, slug)
);

CREATE TABLE chapter_summaries (
  chapter_id INTEGER PRIMARY KEY REFERENCES chapters(id) ON DELETE CASCADE,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  summary TEXT NOT NULL DEFAULT '',
  key_events TEXT NOT NULL DEFAULT '',
  cliffhanger TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE character_states (
  character_id INTEGER PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  current_location TEXT NOT NULL DEFAULT '',
  current_realm TEXT NOT NULL DEFAULT '',
  inventory TEXT NOT NULL DEFAULT '',
  status_effects TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  key_relationships TEXT NOT NULL DEFAULT '',
  recent_events TEXT NOT NULL DEFAULT '',
  type_specific_data TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_novels_user ON novels(user_id);
CREATE INDEX idx_chapters_novel ON chapters(novel_id);
CREATE INDEX idx_outlines_novel ON outlines(novel_id);
CREATE INDEX idx_characters_novel ON characters(novel_id);
CREATE INDEX idx_maps_novel ON maps(novel_id);
CREATE INDEX idx_distilled_authors_user ON distilled_authors(user_id);
CREATE INDEX idx_distilled_sources_author ON distilled_author_sources(author_id);
CREATE INDEX idx_distilled_versions_author ON distilled_author_versions(author_id);
CREATE INDEX idx_writer_state_user ON novel_writer_state(user_id);
CREATE INDEX idx_revisions_chapter ON chapter_revisions(chapter_id);
CREATE INDEX idx_kb_novel ON kb_chunks(novel_id);
CREATE INDEX idx_kb_source ON kb_chunks(novel_id, source_kind, source_id);
CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_skills_scope ON user_skills(user_id, scope, enabled);
CREATE INDEX idx_volumes_novel ON volumes(novel_id);
CREATE INDEX idx_summaries_novel ON chapter_summaries(novel_id);
CREATE INDEX idx_char_states_novel ON character_states(novel_id);
`

class DatabaseBootstrapError extends Error {
  constructor(code, message, details = {}, cause) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = 'DatabaseBootstrapError'
    this.code = code
    this.details = details
  }
}

function validateCoreSchema(db, dbPath) {
  const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(row => row.name))
  for (const [table, required] of Object.entries(REQUIRED_COLUMNS)) {
    if (!tables.has(table)) {
      throw new DatabaseBootstrapError('DB_SCHEMA_INVALID', `数据库缺少起笔必需表：${table}`, { dbPath, table })
    }
    const columns = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name))
    const missingColumns = required.filter(column => !columns.has(column))
    if (missingColumns.length) {
      throw new DatabaseBootstrapError('DB_SCHEMA_INVALID', `数据库的 ${table} 表缺少起笔必需列：${missingColumns.join(', ')}`, { dbPath, table, missingColumns })
    }
  }
}

function validateExistingDatabase(dbPath) {
  let db
  let failure
  try {
    // No schema, seed, journal-mode changes or DML are allowed on this branch.
    db = new DatabaseSync(dbPath, { readOnly: true })
    validateCoreSchema(db, dbPath)
  } catch (error) {
    failure = error instanceof DatabaseBootstrapError
      ? error
      : new DatabaseBootstrapError('DB_INVALID', '既有文件不是可读取的起笔 SQLite 数据库。', { dbPath }, error)
  } finally {
    if (db) {
      try {
        db.close()
      } catch (error) {
        failure ??= new DatabaseBootstrapError('DB_CLOSE_FAILED', '关闭数据库校验连接失败。', { dbPath }, error)
      }
    }
  }
  if (failure) throw failure
  return { dbPath, created: false }
}

/**
 * Create a QiBi-compatible empty database only if novelforge.db does not exist.
 * The caller chooses the default location; this module accepts an explicit absolute directory.
 * Existing files are validated read-only and never migrated or seeded.
 *
 * @param {string} dataDir Explicit absolute directory (created recursively if absent).
 * @returns {{ dbPath: string, created: boolean }} No open handles escape this function.
 * @throws {Error & { code: string, details: object }} Stable code/details for QibiError wrapping.
 */
export function ensureEmptyDatabase(dataDir, { mustCreate = false } = {}) {
  if (typeof dataDir !== 'string' || !dataDir.trim() || dataDir.includes('\0') || !path.isAbsolute(dataDir)
    || (process.platform === 'win32' && !/^(?:[a-z]:[\\/]|\\\\)/i.test(dataDir))) {
    throw new DatabaseBootstrapError('BAD_DATA_DIR', '必须明确指定一个绝对数据目录。')
  }
  const dbPath = path.join(dataDir, 'novelforge.db')
  try {
    fs.mkdirSync(dataDir, { recursive: true })
  } catch (error) {
    throw new DatabaseBootstrapError('DATA_DIR_CREATE_FAILED', '无法创建起笔数据目录。', { dataDir, dbPath }, error)
  }

  let descriptor
  try {
    // wx is the ownership boundary: EEXIST, including a concurrent creator, must
    // take the read-only path. Never infer ownership from existsSync().
    descriptor = fs.openSync(dbPath, 'wx', 0o600)
  } catch (error) {
    if (error?.code === 'EEXIST') {
      if (mustCreate) throw new DatabaseBootstrapError('DB_EXISTS', '此目录已有数据库，未覆盖它；请使用连接已有库。', { dbPath })
      return validateExistingDatabase(dbPath)
    }
    throw new DatabaseBootstrapError('DB_CREATE_FAILED', '无法独占创建起笔数据库。', { dataDir, dbPath }, error)
  }

  let db
  let inTransaction = false
  let failure
  try {
    const owned = fs.fstatSync(descriptor, { bigint: true })
    const current = fs.lstatSync(dbPath, { bigint: true })
    if (!current.isFile() || current.dev !== owned.dev || current.ino !== owned.ino) {
      throw new Error('Exclusive database file was replaced before initialization')
    }
    db = new DatabaseSync(dbPath)
    db.exec('PRAGMA busy_timeout = 5000')
    const mode = db.prepare('PRAGMA journal_mode = WAL').get()
    db.exec('PRAGMA foreign_keys = ON')
    if (mode?.journal_mode !== 'wal' || db.prepare('PRAGMA foreign_keys').get()?.foreign_keys !== 1) {
      throw new Error('WAL or foreign-key enforcement could not be enabled')
    }
    db.exec('BEGIN IMMEDIATE')
    inTransaction = true
    db.exec(EMPTY_SCHEMA)
    // Deliberately not a password hash accepted by QiBi's login implementation.
    // No remote credentials, novels, chapters, settings or examples are seeded.
    db.prepare('INSERT INTO users (id, username, password_hash, role, disabled) VALUES (?, ?, ?, ?, ?)')
      .run(1, '本地作者', '!LOCAL_ONLY_LOGIN_DISABLED!', 'author', 0)
    validateCoreSchema(db, dbPath)
    db.exec('COMMIT')
    inTransaction = false
  } catch (error) {
    failure = new DatabaseBootstrapError('DB_CREATE_FAILED', '起笔空数据库初始化失败；未报告创建成功。', { dataDir, dbPath }, error)
    if (db && inTransaction) {
      try {
        db.exec('ROLLBACK')
      } catch {
        // The original failure remains visible; close is still attempted below.
      }
    }
  } finally {
    if (db) {
      try {
        db.close()
      } catch (error) {
        failure ??= new DatabaseBootstrapError('DB_CLOSE_FAILED', '关闭新建数据库连接失败。', { dbPath }, error)
      }
    }
    try {
      fs.closeSync(descriptor)
    } catch (error) {
      failure ??= new DatabaseBootstrapError('DB_CLOSE_FAILED', '关闭新建数据库文件句柄失败。', { dbPath }, error)
    }
    // Do not unlink anything on error. Retaining the failed file is safer than
    // accidentally deleting a replacement / concurrently created database.
  }
  if (failure) throw failure
  return { dbPath, created: true }
}
