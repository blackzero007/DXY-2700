import initSqlJs from 'sql.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.resolve(__dirname, '../data.db')

const SQL = await initSqlJs()

let db: InstanceType<typeof SQL.Database>

if (fs.existsSync(DB_PATH)) {
  const buffer = fs.readFileSync(DB_PATH)
  db = new SQL.Database(buffer)
} else {
  db = new SQL.Database()
}

db.run('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
`)

const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='samples'")
const samplesTableExists = tableCheck[0]?.values.length > 0

if (!samplesTableExists) {
  db.exec(`
    CREATE TABLE samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '已登记',
      batch_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
    );
  `)
} else {
  const pragmaResult = db.exec('PRAGMA table_info(samples)')
  const sampleColumns = pragmaResult[0]?.values.map((row) => row[1] as string) || []
  const hasBatchId = sampleColumns.includes('batch_id')

  if (!hasBatchId) {
    db.exec(`
      CREATE TABLE samples_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        source TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT '已登记',
        batch_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
      );
      INSERT INTO samples_new (id, code, name, type, source, status, created_at, updated_at)
      SELECT id, code, name, type, source, status, created_at, updated_at FROM samples;
      DROP TABLE samples;
      ALTER TABLE samples_new RENAME TO samples;
    `)
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS transitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sample_id INTEGER NOT NULL,
    node_name TEXT NOT NULL,
    operator TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS sample_tags (
    sample_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    PRIMARY KEY (sample_id, tag_id),
    FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_transitions_sample_id ON transitions(sample_id);
  CREATE INDEX IF NOT EXISTS idx_samples_code ON samples(code);
  CREATE INDEX IF NOT EXISTS idx_samples_batch_id ON samples(batch_id);
  CREATE INDEX IF NOT EXISTS idx_batches_code ON batches(code);
  CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
  CREATE INDEX IF NOT EXISTS idx_sample_tags_sample_id ON sample_tags(sample_id);
  CREATE INDEX IF NOT EXISTS idx_sample_tags_tag_id ON sample_tags(tag_id);
`)

const tagCheck = db.exec("SELECT COUNT(*) as count FROM tags")
const tagCount = tagCheck[0]?.values[0]?.[0] as number || 0

if (tagCount === 0) {
  const defaultTags = [
    { name: '加急', color: '#ef4444', description: '需要优先处理的样本' },
    { name: '复检', color: '#f59e0b', description: '需要重新检测的样本' },
    { name: '外部送检', color: '#8b5cf6', description: '送外部机构检测的样本' },
    { name: '重点跟踪', color: '#10b981', description: '需要重点关注的样本' },
  ]

  const insertTag = db.prepare('INSERT INTO tags (name, color, description) VALUES (?, ?, ?)')
  defaultTags.forEach(tag => {
    insertTag.run([tag.name, tag.color, tag.description])
  })
  insertTag.free()
  saveDb()
}

function saveDb(): void {
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

export { db, saveDb }
