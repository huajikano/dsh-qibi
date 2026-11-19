// Focused database bootstrap checks. All fixtures live below this run's os.tmpdir() mkdtemp.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { ensureEmptyDatabase } from '../lib/database.js'

const expectedColumns = {
  users: 'id username password_hash role ai_api_key_enc ai_api_key_enabled ai_api_base_url ai_api_protocol ai_api_model ai_api_thinking distill_api_key_enc distill_api_key_enabled distill_api_base_url distill_api_protocol distill_api_model distill_api_thinking world_api_key_enc world_api_key_enabled world_api_base_url world_api_protocol world_api_model world_api_thinking agent_api_key_enc agent_api_key_enabled agent_api_base_url agent_api_protocol agent_api_model agent_api_thinking disabled created_at ai_custom_prompts registered_from_ip',
  novels: 'id user_id title author genre status intro cover_color word_count is_public created_at updated_at',
  chapters: 'id novel_id title content status word_count sort_order created_at updated_at volume_id',
  outlines: 'id novel_id chapter_id title content sort_order created_at updated_at',
  characters: 'id novel_id name alias role gender age appearance personality background relationships sort_order created_at updated_at',
  maps: 'id novel_id name data thumbnail updated_at',
  volumes: 'id novel_id title summary core_conflict sort_order created_at updated_at',
  chapter_summaries: 'chapter_id novel_id summary key_events cliffhanger updated_at',
  character_states: 'character_id novel_id current_location current_realm inventory status_effects notes updated_at key_relationships recent_events type_specific_data',
  novel_writer_state: 'novel_id user_id distilled_author_id progress foreshadowing updated_at',
  chapter_revisions: 'id chapter_id novel_id user_id title content word_count reason created_at',
  kb_chunks: 'id novel_id source_kind source_id title content indexed_at',
  user_skills: 'id user_id name slug scope source_kind source_ref content enabled priority notes created_at updated_at',
  distilled_authors: 'id user_id name slug profile current_version_id status created_at updated_at',
  distilled_author_sources: 'id author_id user_id kind filename format stored_path size_bytes parsed_chars chapter_count status error created_at',
  distilled_author_versions: 'id author_id user_id version writing_skill author_persona skill_markdown sample_summary created_at',
}

const tmpBase = fs.realpathSync(os.tmpdir())
const root = fs.mkdtempSync(path.join(tmpBase, 'dsh-qibi-database-check-'))
const rootIdentity = fs.statSync(root, { bigint: true })
let passed = 0

function fixture(name) {
  const dir = path.join(root, name)
  fs.mkdirSync(dir)
  return dir
}

function withDatabase(dbPath, fn, options = {}) {
  const db = new DatabaseSync(dbPath, options)
  try {
    return fn(db)
  } finally {
    db.close()
  }
}

function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

function expectCode(fn, code) {
  assert.throws(fn, error => {
    assert.equal(error.code, code)
    assert.equal(typeof error.message, 'string')
    assert.equal(typeof error.details, 'object')
    return true
  })
}

function cleanup() {
  const absolute = path.resolve(root)
  const relative = path.relative(root, absolute)
  assert.ok(path.isAbsolute(absolute))
  assert.equal(path.dirname(absolute), tmpBase)
  assert.ok(path.basename(absolute).startsWith('dsh-qibi-database-check-'))
  assert.ok(relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative)))
  assert.equal(fs.realpathSync(absolute), absolute)
  const current = fs.statSync(absolute, { bigint: true })
  assert.equal(current.dev, rootIdentity.dev)
  assert.equal(current.ino, rootIdentity.ino)
  fs.rmSync(absolute, { recursive: true, force: true })
}

try {
  check('requires an explicit absolute directory', () => {
    for (const value of [undefined, null, '', 'relative-data', '.', 123]) {
      expectCode(() => ensureEmptyDatabase(value), 'BAD_DATA_DIR')
    }
  })

  const dataDir = path.join(root, 'fresh', 'nested-data')
  const dbPath = path.join(dataDir, 'novelforge.db')
  check('creates a fresh database and all QiBi domain columns', () => {
    assert.deepEqual(ensureEmptyDatabase(dataDir), { dbPath, created: true })
    withDatabase(dbPath, db => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all().map(row => row.name)
      assert.deepEqual(tables.sort(), Object.keys(expectedColumns).sort())
      for (const [table, expected] of Object.entries(expectedColumns)) {
        const actual = db.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name)
        assert.deepEqual(actual.sort(), expected.split(' ').sort(), `${table}: complete columns`)
      }
      assert.equal(db.prepare('PRAGMA journal_mode').get().journal_mode, 'wal')
      assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1)
      assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok')
      assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [])
    })
  })

  check('seeds exactly one local author and no content or credentials', () => {
    withDatabase(dbPath, db => {
      const users = db.prepare('SELECT * FROM users').all()
      assert.equal(users.length, 1)
      const user = users[0]
      assert.equal(user.id, 1)
      assert.equal(user.username, '本地作者')
      assert.equal(user.role, 'author')
      assert.equal(user.disabled, 0)
      assert.match(user.password_hash, /^!.*LOCAL.*LOGIN.*DISABLED/i)
      for (const prefix of ['ai', 'distill', 'world', 'agent']) {
        assert.equal(user[`${prefix}_api_key_enc`], null)
        assert.equal(user[`${prefix}_api_key_enabled`], 0)
        assert.equal(user[`${prefix}_api_base_url`], null)
        assert.equal(user[`${prefix}_api_model`], null)
      }
      for (const table of Object.keys(expectedColumns).filter(name => name !== 'users')) {
        assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n, 0, `${table}: initially empty`)
      }
    }, { readOnly: true })
  })

  check('supports the SQL used for QiBi core entities and v2 state', () => {
    withDatabase(dbPath, db => {
      db.exec('PRAGMA foreign_keys = ON')
      const novelId = db.prepare('INSERT INTO novels (user_id, title, author, genre, status, intro, cover_color) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(1, '临时测试作品', '测试作者', '悬疑', '连载中', '测试简介', '#e60012').lastInsertRowid
      const volumeId = db.prepare('INSERT INTO volumes (novel_id, title, summary, core_conflict, sort_order) VALUES (?, ?, ?, ?, ?)')
        .run(novelId, '第一卷', '卷摘要', '冲突', 1).lastInsertRowid
      const chapterId = db.prepare('INSERT INTO chapters (novel_id, title, content, word_count, volume_id) VALUES (?, ?, ?, ?, ?)')
        .run(novelId, '第一章', '只在临时目录的测试正文', 11, volumeId).lastInsertRowid
      db.prepare('INSERT INTO outlines (novel_id, chapter_id, title, content, sort_order) VALUES (?, ?, ?, ?, ?)')
        .run(novelId, chapterId, '细纲', '测试细纲', 1)
      const characterId = db.prepare('INSERT INTO characters (novel_id, name, relationships) VALUES (?, ?, ?)')
        .run(novelId, '测试人物', '[{"name":"测试关系"}]').lastInsertRowid
      db.prepare('INSERT INTO character_states (character_id, novel_id, current_location, current_realm, inventory, status_effects, notes, key_relationships, recent_events, type_specific_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(characterId, novelId, '测试位置', '测试境界', '测试道具', '', '备注', '测试关系', '测试事件', '{"kind":"test"}')
      db.prepare('INSERT INTO chapter_summaries (chapter_id, novel_id, summary, key_events, cliffhanger) VALUES (?, ?, ?, ?, ?)')
        .run(chapterId, novelId, '章摘要', '事件', '悬念')
      db.prepare('INSERT INTO maps (novel_id, name, data) VALUES (?, ?, ?)').run(novelId, '测试地图', '{}')
      const authorId = db.prepare('INSERT INTO distilled_authors (user_id, name, slug, profile) VALUES (?, ?, ?, ?)')
        .run(1, '测试风格', 'test-style', '{}').lastInsertRowid
      const versionId = db.prepare('INSERT INTO distilled_author_versions (author_id, user_id, version, writing_skill, author_persona, skill_markdown, sample_summary) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(authorId, 1, 1, '写作规则', '作者画像', '# 测试 Skill', '样本摘要').lastInsertRowid
      db.prepare('UPDATE distilled_authors SET current_version_id = ? WHERE id = ?').run(versionId, authorId)
      db.prepare('INSERT INTO distilled_author_sources (author_id, user_id, kind, filename, format, stored_path, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(authorId, 1, 'novel', 'fixture.txt', 'txt', path.join(dataDir, 'fixture.txt'), 'ready')
      db.prepare('INSERT INTO novel_writer_state (novel_id, user_id, distilled_author_id, progress, foreshadowing) VALUES (?, ?, ?, ?, ?)')
        .run(novelId, 1, authorId, '测试进度', '[]')
      db.prepare('INSERT INTO chapter_revisions (chapter_id, novel_id, user_id, title, content, word_count, reason) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(chapterId, novelId, 1, '第一章', '测试版本', 4, 'DSH 写入前备份')
      db.prepare('INSERT INTO kb_chunks (novel_id, source_kind, source_id, title, content) VALUES (?, ?, ?, ?, ?)')
        .run(novelId, 'chapter', chapterId, '第一章', '测试分块')
      db.prepare('INSERT INTO user_skills (user_id, name, slug, content) VALUES (?, ?, ?, ?)').run(1, '测试 Skill', 'test-skill', '# 测试')
      db.prepare('UPDATE novels SET updated_at = ?, word_count = ? WHERE id = ?').run('2001-02-03 04:05:06', 11, novelId)
      assert.equal(db.prepare('SELECT content FROM chapters WHERE id = ?').get(chapterId).content, '只在临时目录的测试正文')
      assert.equal(db.prepare('SELECT type_specific_data FROM character_states WHERE character_id = ?').get(characterId).type_specific_data, '{"kind":"test"}')
      assert.equal(db.prepare('SELECT summary FROM chapter_summaries WHERE chapter_id = ?').get(chapterId).summary, '章摘要')
      assert.equal(db.prepare('SELECT progress FROM novel_writer_state WHERE novel_id = ?').get(novelId).progress, '测试进度')
      for (const table of Object.keys(expectedColumns)) {
        assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n, 1, `${table}: readable fixture row`)
      }
      assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [])
    })
  })

  check('reentry preserves every database byte, schema, novel and timestamps', () => {
    const beforeBytes = fs.readFileSync(dbPath)
    const beforeStat = fs.statSync(dbPath, { bigint: true })
    const beforeSchema = withDatabase(dbPath, db => db.prepare('SELECT type, name, sql FROM sqlite_master ORDER BY name').all(), { readOnly: true })
    assert.deepEqual(ensureEmptyDatabase(dataDir), { dbPath, created: false })
    assert.deepEqual(ensureEmptyDatabase(dataDir), { dbPath, created: false })
    expectCode(() => ensureEmptyDatabase(dataDir, { mustCreate: true }), 'DB_EXISTS')
    assert.deepEqual(fs.readFileSync(dbPath), beforeBytes)
    assert.equal(fs.statSync(dbPath, { bigint: true }).mtimeNs, beforeStat.mtimeNs)
    withDatabase(dbPath, db => {
      assert.deepEqual(db.prepare('SELECT type, name, sql FROM sqlite_master ORDER BY name').all(), beforeSchema)
      const novel = db.prepare('SELECT title, updated_at, word_count FROM novels').get()
      assert.deepEqual({ ...novel }, { title: '临时测试作品', updated_at: '2001-02-03 04:05:06', word_count: 11 })
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 1)
    }, { readOnly: true })
  })

  check('rejects bad files and empty existing files without changing bytes', () => {
    for (const [name, bytes] of [['bad-bytes', Buffer.from('This is not a SQLite database.\0\xff', 'utf8')], ['empty-existing', Buffer.alloc(0)]]) {
      const dir = fixture(name)
      const file = path.join(dir, 'novelforge.db')
      fs.writeFileSync(file, bytes, { flag: 'wx' })
      const before = fs.statSync(file, { bigint: true })
      expectCode(() => ensureEmptyDatabase(dir), name === 'bad-bytes' ? 'DB_INVALID' : 'DB_SCHEMA_INVALID')
      assert.deepEqual(fs.readFileSync(file), bytes)
      assert.equal(fs.statSync(file, { bigint: true }).mtimeNs, before.mtimeNs)
    }
  })

  check('rejects unrelated SQLite and missing basic columns without migration', () => {
    for (const [name, sql] of [
      ['unrelated', 'CREATE TABLE unrelated (id INTEGER PRIMARY KEY)'],
      ['wrong-columns', 'CREATE TABLE users (id INTEGER); CREATE TABLE novels (id INTEGER); CREATE TABLE chapters (id INTEGER)'],
    ]) {
      const dir = fixture(name)
      const file = path.join(dir, 'novelforge.db')
      withDatabase(file, db => db.exec(sql))
      const before = fs.readFileSync(file)
      expectCode(() => ensureEmptyDatabase(dir), 'DB_SCHEMA_INVALID')
      assert.deepEqual(fs.readFileSync(file), before)
    }
  })

  check('retains compatibility with an existing minimal QiBi core schema', () => {
    const dir = fixture('minimal-existing')
    const file = path.join(dir, 'novelforge.db')
    withDatabase(file, db => db.exec(`
      CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, role TEXT, disabled INTEGER);
      CREATE TABLE novels (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, author TEXT, genre TEXT, status TEXT, word_count INTEGER, updated_at TEXT);
      CREATE TABLE chapters (id INTEGER PRIMARY KEY, novel_id INTEGER, title TEXT, content TEXT, status TEXT, word_count INTEGER, sort_order INTEGER, updated_at TEXT);
    `))
    const before = fs.readFileSync(file)
    assert.deepEqual(ensureEmptyDatabase(dir), { dbPath: file, created: false })
    assert.deepEqual(fs.readFileSync(file), before)
    withDatabase(file, db => {
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table'").get().n, 3)
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 0, 'existing users must not be seeded')
    }, { readOnly: true })
  })

  check('foreign keys reject orphans and apply QiBi cascade / SET NULL rules', () => {
    const dir = fixture('foreign-keys')
    const file = ensureEmptyDatabase(dir).dbPath
    withDatabase(file, db => {
      assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1)
      assert.throws(() => db.prepare('INSERT INTO novels (user_id, title) VALUES (?, ?)').run(999, '孤立作品'), /FOREIGN KEY/)
      assert.throws(() => db.prepare('INSERT INTO chapters (novel_id, title) VALUES (?, ?)').run(999, '孤立章节'), /FOREIGN KEY/)
      const novelId = db.prepare('INSERT INTO novels (user_id, title) VALUES (?, ?)').run(1, '级联测试').lastInsertRowid
      const volumeId = db.prepare('INSERT INTO volumes (novel_id, title) VALUES (?, ?)').run(novelId, '分卷').lastInsertRowid
      const chapterId = db.prepare('INSERT INTO chapters (novel_id, title, volume_id) VALUES (?, ?, ?)').run(novelId, '章节', volumeId).lastInsertRowid
      db.prepare('DELETE FROM volumes WHERE id = ?').run(volumeId)
      assert.equal(db.prepare('SELECT volume_id FROM chapters WHERE id = ?').get(chapterId).volume_id, null)
      db.prepare('INSERT INTO outlines (novel_id, chapter_id) VALUES (?, ?)').run(novelId, chapterId)
      db.prepare('INSERT INTO chapter_summaries (chapter_id, novel_id) VALUES (?, ?)').run(chapterId, novelId)
      db.prepare('DELETE FROM novels WHERE id = ?').run(novelId)
      for (const table of ['chapters', 'outlines', 'chapter_summaries']) {
        assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n, 0)
      }
      assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [])
    })
  })

  check('a concurrent creator winning wx is validated without being overwritten', () => {
    const dir = fixture('concurrent-winner')
    const file = path.join(dir, 'novelforge.db')
    const winnerBytes = fs.readFileSync(dbPath)
    const originalOpen = fs.openSync
    let raced = false
    fs.openSync = function (target, flags, ...rest) {
      if (!raced && target === file && flags === 'wx') {
        raced = true
        fs.writeFileSync(file, winnerBytes, { flag: 'wx' })
      }
      return originalOpen.call(this, target, flags, ...rest)
    }
    try {
      assert.deepEqual(ensureEmptyDatabase(dir), { dbPath: file, created: false })
      assert.equal(raced, true)
      assert.deepEqual(fs.readFileSync(file), winnerBytes)
    } finally {
      fs.openSync = originalOpen
    }
  })

  check('initialization failure rolls back schema and closes all owned handles', () => {
    const dir = fixture('failed-initialization')
    const file = path.join(dir, 'novelforge.db')
    const originalExec = DatabaseSync.prototype.exec
    let failed = false
    DatabaseSync.prototype.exec = function (sql, ...rest) {
      if (!failed && sql.includes('CREATE TABLE users')) {
        failed = true
        originalExec.call(this, 'CREATE TABLE must_be_rolled_back (id INTEGER)')
        throw new Error('Injected schema initialization failure')
      }
      return originalExec.call(this, sql, ...rest)
    }
    try {
      expectCode(() => ensureEmptyDatabase(dir), 'DB_CREATE_FAILED')
    } finally {
      DatabaseSync.prototype.exec = originalExec
    }
    assert.equal(failed, true)
    assert.equal(fs.existsSync(file), true, 'failure does not silently remove a database file')
    withDatabase(file, db => {
      assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table'").get().n, 0)
      db.exec('BEGIN EXCLUSIVE; ROLLBACK')
    })
    const renamed = path.join(dir, 'closed-handles.db')
    assert.ok(path.isAbsolute(file) && path.relative(root, file).startsWith(`failed-initialization${path.sep}`))
    assert.ok(path.isAbsolute(renamed) && path.relative(root, renamed).startsWith(`failed-initialization${path.sep}`))
    fs.renameSync(file, renamed)
    assert.equal(fs.existsSync(renamed), true)
  })

  check('a replacement file detected before initialization is never deleted', () => {
    const dir = fixture('replaced-file')
    const file = path.join(dir, 'novelforge.db')
    const held = path.join(dir, 'exclusive-owned-file.db')
    const replacement = Buffer.from('A concurrent replacement must survive unchanged.')
    const originalLstat = fs.lstatSync
    let replaced = false
    fs.lstatSync = function (target, ...rest) {
      if (!replaced && target === file) {
        replaced = true
        assert.ok(path.isAbsolute(file) && path.relative(root, file).startsWith(`replaced-file${path.sep}`))
        assert.ok(path.isAbsolute(held) && path.relative(root, held).startsWith(`replaced-file${path.sep}`))
        fs.renameSync(file, held)
        fs.writeFileSync(file, replacement, { flag: 'wx' })
      }
      return originalLstat.call(this, target, ...rest)
    }
    try {
      expectCode(() => ensureEmptyDatabase(dir), 'DB_CREATE_FAILED')
    } finally {
      fs.lstatSync = originalLstat
    }
    assert.equal(replaced, true)
    assert.deepEqual(fs.readFileSync(file), replacement)
    assert.equal(fs.statSync(held).size, 0)
  })

  console.log(`database-check: ${passed} checks passed (temporary fixtures only)`)
} finally {
  cleanup()
}
