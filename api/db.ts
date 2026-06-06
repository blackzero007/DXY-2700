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

  CREATE TABLE IF NOT EXISTS sample_exceptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sample_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT '待处理',
    reporter TEXT NOT NULL,
    handler TEXT,
    resolution TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    resolved_at TEXT,
    FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sample_exceptions_sample_id ON sample_exceptions(sample_id);
  CREATE INDEX IF NOT EXISTS idx_sample_exceptions_status ON sample_exceptions(status);
  CREATE INDEX IF NOT EXISTS idx_sample_exceptions_type ON sample_exceptions(type);

  CREATE TABLE IF NOT EXISTS operators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    employee_id TEXT NOT NULL UNIQUE,
    team TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_operators_employee_id ON operators(employee_id);
  CREATE INDEX IF NOT EXISTS idx_operators_team ON operators(team);

  CREATE TABLE IF NOT EXISTS sample_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_sample_types_name ON sample_types(name);
  CREATE INDEX IF NOT EXISTS idx_sample_types_sort_order ON sample_types(sort_order);

  CREATE TABLE IF NOT EXISTS source_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT '医院',
    code TEXT,
    contact_person TEXT DEFAULT '',
    contact_phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    description TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_source_units_name ON source_units(name);
  CREATE INDEX IF NOT EXISTS idx_source_units_type ON source_units(type);
  CREATE INDEX IF NOT EXISTS idx_source_units_code ON source_units(code);
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

const operatorCheck = db.exec("SELECT COUNT(*) as count FROM operators")
const operatorCount = operatorCheck[0]?.values[0]?.[0] as number || 0

if (operatorCount === 0) {
  const defaultOperators = [
    { name: '张伟', employee_id: 'EMP001', team: '分子生物学组' },
    { name: '李娜', employee_id: 'EMP002', team: '分子生物学组' },
    { name: '王强', employee_id: 'EMP003', team: '细胞生物学组' },
    { name: '刘洋', employee_id: 'EMP004', team: '细胞生物学组' },
    { name: '陈静', employee_id: 'EMP005', team: '分析测试组' },
  ]

  const insertOperator = db.prepare('INSERT INTO operators (name, employee_id, team) VALUES (?, ?, ?)')
  defaultOperators.forEach(op => {
    insertOperator.run([op.name, op.employee_id, op.team])
  })
  insertOperator.free()
  saveDb()
}

const sampleTypeCheck = db.exec("SELECT COUNT(*) as count FROM sample_types")
const sampleTypeCount = sampleTypeCheck[0]?.values[0]?.[0] as number || 0

if (sampleTypeCount === 0) {
  const defaultSampleTypes = [
    { name: '血液', description: '血液样本', sort_order: 1 },
    { name: '尿液', description: '尿液样本', sort_order: 2 },
    { name: '组织', description: '组织样本', sort_order: 3 },
    { name: '细胞', description: '细胞样本', sort_order: 4 },
    { name: '唾液', description: '唾液样本', sort_order: 5 },
    { name: '脑脊液', description: '脑脊液样本', sort_order: 6 },
    { name: '其他', description: '其他类型样本', sort_order: 99 },
  ]

  const insertSampleType = db.prepare('INSERT INTO sample_types (name, description, sort_order) VALUES (?, ?, ?)')
  defaultSampleTypes.forEach(st => {
    insertSampleType.run([st.name, st.description, st.sort_order])
  })
  insertSampleType.free()
  saveDb()
}

const sourceUnitCheck = db.exec("SELECT COUNT(*) as count FROM source_units")
const sourceUnitCount = sourceUnitCheck[0]?.values[0]?.[0] as number || 0

if (sourceUnitCount === 0) {
  const defaultSourceUnits = [
    { name: '市第一人民医院', type: '医院', code: 'HOS001', contact_person: '张主任', contact_phone: '13800138001', address: '市中心区人民路1号', description: '三甲综合医院', sort_order: 1 },
    { name: '市第二人民医院', type: '医院', code: 'HOS002', contact_person: '李主任', contact_phone: '13800138002', address: '东区建设大街88号', description: '三甲综合医院', sort_order: 2 },
    { name: '中心医院内科', type: '科室', code: 'DEP001', contact_person: '王医生', contact_phone: '13800138003', address: '中心医院门诊楼3层', description: '内科门诊', sort_order: 3 },
    { name: '中心医院外科', type: '科室', code: 'DEP002', contact_person: '刘医生', contact_phone: '13800138004', address: '中心医院门诊楼4层', description: '外科门诊', sort_order: 4 },
    { name: '华大基因检测中心', type: '合作机构', code: 'EXT001', contact_person: '陈经理', contact_phone: '13800138005', address: '高新区科技路100号', description: '第三方检测机构', sort_order: 5 },
    { name: '省疾控中心', type: '合作机构', code: 'EXT002', contact_person: '赵主任', contact_phone: '13800138006', address: '高新区疾控路1号', description: '省级疾控中心', sort_order: 6 },
  ]

  const insertSourceUnit = db.prepare('INSERT INTO source_units (name, type, code, contact_person, contact_phone, address, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  defaultSourceUnits.forEach(su => {
    insertSourceUnit.run([su.name, su.type, su.code, su.contact_person, su.contact_phone, su.address, su.description, su.sort_order])
  })
  insertSourceUnit.free()
  saveDb()
}

function saveDb(): void {
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

export { db, saveDb }
