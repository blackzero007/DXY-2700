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
    const stmt = db.prepare('SELECT * FROM sample_types ORDER BY sort_order ASC, id ASC')
    const results: Record<string, unknown>[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()

    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取样本类型列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const stmt = db.prepare('SELECT * FROM sample_types WHERE id = ?')
    stmt.bind([id])
    let sampleType: Record<string, unknown> | null = null
    if (stmt.step()) {
      sampleType = stmt.getAsObject()
    }
    stmt.free()

    if (!sampleType) {
      res.status(404).json({ success: false, error: '样本类型不存在' })
      return
    }

    res.json({ success: true, data: sampleType })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取样本类型详情失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, sort_order } = req.body

    if (!name) {
      res.status(400).json({ success: false, error: '样本类型名称不能为空' })
      return
    }

    const existing = db.prepare('SELECT id FROM sample_types WHERE name = ?')
    existing.bind([name])
    if (existing.step()) {
      existing.free()
      res.status(409).json({ success: false, error: '样本类型名称已存在' })
      return
    }
    existing.free()

    db.run(
      'INSERT INTO sample_types (name, description, sort_order) VALUES (?, ?, ?)',
      [name, description || '', sort_order || 0]
    )

    const sampleTypeId = getLastInsertId()
    saveDb()

    const stmt = db.prepare('SELECT * FROM sample_types WHERE id = ?')
    stmt.bind([sampleTypeId])
    let sampleType: Record<string, unknown> | null = null
    if (stmt.step()) {
      sampleType = stmt.getAsObject()
    }
    stmt.free()

    res.status(201).json({ success: true, data: sampleType })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建样本类型失败' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const { name, description, sort_order } = req.body

    const checkStmt = db.prepare('SELECT id FROM sample_types WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '样本类型不存在' })
      return
    }
    checkStmt.free()

    if (name) {
      const nameCheck = db.prepare('SELECT id FROM sample_types WHERE name = ? AND id != ?')
      nameCheck.bind([name, id])
      if (nameCheck.step()) {
        nameCheck.free()
        res.status(409).json({ success: false, error: '样本类型名称已存在' })
        return
      }
      nameCheck.free()
    }

    const fields: string[] = []
    const values: unknown[] = []

    if (name !== undefined) {
      fields.push('name = ?')
      values.push(name)
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

    db.run(`UPDATE sample_types SET ${fields.join(', ')} WHERE id = ?`, values)
    saveDb()

    const stmt = db.prepare('SELECT * FROM sample_types WHERE id = ?')
    stmt.bind([id])
    let sampleType: Record<string, unknown> | null = null
    if (stmt.step()) {
      sampleType = stmt.getAsObject()
    }
    stmt.free()

    res.json({ success: true, data: sampleType })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新样本类型失败' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const checkStmt = db.prepare('SELECT id FROM sample_types WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '样本类型不存在' })
      return
    }
    checkStmt.free()

    const sampleCheck = db.prepare('SELECT COUNT(*) as count FROM samples WHERE type IN (SELECT name FROM sample_types WHERE id = ?)')
    sampleCheck.bind([id])
    let sampleCount = 0
    if (sampleCheck.step()) {
      const row = sampleCheck.getAsObject() as { count: number }
      sampleCount = row.count
    }
    sampleCheck.free()

    if (sampleCount > 0) {
      res.status(400).json({ success: false, error: '该样本类型已被样本使用，无法删除' })
      return
    }

    db.run('DELETE FROM sample_types WHERE id = ?', [id])
    saveDb()

    res.json({ success: true, message: '样本类型已删除' })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除样本类型失败' })
  }
})

export default router
