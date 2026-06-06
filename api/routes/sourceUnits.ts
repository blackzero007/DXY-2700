import { Router, type Request, type Response } from 'express'
import { db, saveDb } from '../db.js'

const router = Router()

function getLastInsertId(): number {
  const stmt = db.prepare('SELECT last_insert_rowid() as id')
  stmt.step()
  const row = stmt.getAsObject() as { id: number }
  stmt.free()
  return row.id
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const type = req.query.type as string | undefined
    const search = req.query.search as string | undefined
    const conditions: string[] = []
    const params: unknown[] = []

    if (type) {
      conditions.push('type = ?')
      params.push(type)
    }

    if (search) {
      conditions.push('(name LIKE ? OR code LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }

    let sql = 'SELECT * FROM source_units'
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    sql += ' ORDER BY sort_order ASC, created_at ASC'

    const stmt = db.prepare(sql)
    stmt.bind(params)

    const results: Record<string, unknown>[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()

    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取来源单位列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const stmt = db.prepare('SELECT * FROM source_units WHERE id = ?')
    stmt.bind([id])
    let sourceUnit: Record<string, unknown> | null = null
    if (stmt.step()) {
      sourceUnit = stmt.getAsObject()
    }
    stmt.free()

    if (!sourceUnit) {
      res.status(404).json({ success: false, error: '来源单位不存在' })
      return
    }

    res.json({ success: true, data: sourceUnit })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取来源单位详情失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, code, contact_person, contact_phone, address, description, sort_order } = req.body

    if (!name) {
      res.status(400).json({ success: false, error: '单位名称不能为空' })
      return
    }

    const existing = db.prepare('SELECT id FROM source_units WHERE name = ?')
    existing.bind([name])
    if (existing.step()) {
      existing.free()
      res.status(409).json({ success: false, error: '来源单位名称已存在' })
      return
    }
    existing.free()

    if (code) {
      const codeExisting = db.prepare('SELECT id FROM source_units WHERE code = ?')
      codeExisting.bind([code])
      if (codeExisting.step()) {
        codeExisting.free()
        res.status(409).json({ success: false, error: '单位编码已存在' })
        return
      }
      codeExisting.free()
    }

    db.run(
      'INSERT INTO source_units (name, type, code, contact_person, contact_phone, address, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        type || '医院',
        code || null,
        contact_person || '',
        contact_phone || '',
        address || '',
        description || '',
        sort_order || 0,
      ]
    )

    const sourceUnitId = getLastInsertId()
    saveDb()

    const stmt = db.prepare('SELECT * FROM source_units WHERE id = ?')
    stmt.bind([sourceUnitId])
    let sourceUnit: Record<string, unknown> | null = null
    if (stmt.step()) {
      sourceUnit = stmt.getAsObject()
    }
    stmt.free()

    res.status(201).json({ success: true, data: sourceUnit })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建来源单位失败' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const { name, type, code, contact_person, contact_phone, address, description, sort_order } = req.body

    const checkStmt = db.prepare('SELECT id FROM source_units WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '来源单位不存在' })
      return
    }
    checkStmt.free()

    if (name) {
      const nameCheck = db.prepare('SELECT id FROM source_units WHERE name = ? AND id != ?')
      nameCheck.bind([name, id])
      if (nameCheck.step()) {
        nameCheck.free()
        res.status(409).json({ success: false, error: '来源单位名称已存在' })
        return
      }
      nameCheck.free()
    }

    if (code) {
      const codeCheck = db.prepare('SELECT id FROM source_units WHERE code = ? AND id != ?')
      codeCheck.bind([code, id])
      if (codeCheck.step()) {
        codeCheck.free()
        res.status(409).json({ success: false, error: '单位编码已存在' })
        return
      }
      codeCheck.free()
    }

    const fields: string[] = []
    const values: unknown[] = []

    if (name !== undefined) {
      fields.push('name = ?')
      values.push(name)
    }
    if (type !== undefined) {
      fields.push('type = ?')
      values.push(type)
    }
    if (code !== undefined) {
      fields.push('code = ?')
      values.push(code || null)
    }
    if (contact_person !== undefined) {
      fields.push('contact_person = ?')
      values.push(contact_person)
    }
    if (contact_phone !== undefined) {
      fields.push('contact_phone = ?')
      values.push(contact_phone)
    }
    if (address !== undefined) {
      fields.push('address = ?')
      values.push(address)
    }
    if (description !== undefined) {
      fields.push('description = ?')
      values.push(description)
    }
    if (sort_order !== undefined) {
      fields.push('sort_order = ?')
      values.push(sort_order)
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, error: '没有提供要更新的字段' })
      return
    }

    fields.push('updated_at = datetime(\'now\',\'localtime\')')
    values.push(id)

    db.run(`UPDATE source_units SET ${fields.join(', ')} WHERE id = ?`, values)
    saveDb()

    const stmt = db.prepare('SELECT * FROM source_units WHERE id = ?')
    stmt.bind([id])
    let sourceUnit: Record<string, unknown> | null = null
    if (stmt.step()) {
      sourceUnit = stmt.getAsObject()
    }
    stmt.free()

    res.json({ success: true, data: sourceUnit })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新来源单位失败' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const checkStmt = db.prepare('SELECT id FROM source_units WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '来源单位不存在' })
      return
    }
    checkStmt.free()

    db.run('DELETE FROM source_units WHERE id = ?', [id])
    saveDb()

    res.json({ success: true, message: '来源单位已删除' })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除来源单位失败' })
  }
})

export default router
