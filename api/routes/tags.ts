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
    const stmt = db.prepare('SELECT * FROM tags ORDER BY created_at ASC')
    const results: Record<string, unknown>[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()

    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取标签列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const stmt = db.prepare('SELECT * FROM tags WHERE id = ?')
    stmt.bind([id])
    let tag: Record<string, unknown> | null = null
    if (stmt.step()) {
      tag = stmt.getAsObject()
    }
    stmt.free()

    if (!tag) {
      res.status(404).json({ success: false, error: '标签不存在' })
      return
    }

    res.json({ success: true, data: tag })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取标签详情失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, color, description } = req.body

    if (!name) {
      res.status(400).json({ success: false, error: '标签名称不能为空' })
      return
    }

    const existing = db.prepare('SELECT id FROM tags WHERE name = ?')
    existing.bind([name])
    if (existing.step()) {
      existing.free()
      res.status(409).json({ success: false, error: '标签名称已存在' })
      return
    }
    existing.free()

    db.run(
      'INSERT INTO tags (name, color, description) VALUES (?, ?, ?)',
      [name, color || '#3b82f6', description || '']
    )

    const tagId = getLastInsertId()
    saveDb()

    const stmt = db.prepare('SELECT * FROM tags WHERE id = ?')
    stmt.bind([tagId])
    let tag: Record<string, unknown> | null = null
    if (stmt.step()) {
      tag = stmt.getAsObject()
    }
    stmt.free()

    res.status(201).json({ success: true, data: tag })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建标签失败' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const { name, color, description } = req.body

    const checkStmt = db.prepare('SELECT id FROM tags WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '标签不存在' })
      return
    }
    checkStmt.free()

    if (name) {
      const nameCheck = db.prepare('SELECT id FROM tags WHERE name = ? AND id != ?')
      nameCheck.bind([name, id])
      if (nameCheck.step()) {
        nameCheck.free()
        res.status(409).json({ success: false, error: '标签名称已存在' })
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
    if (color !== undefined) {
      fields.push('color = ?')
      values.push(color)
    }
    if (description !== undefined) {
      fields.push('description = ?')
      values.push(description)
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, error: '没有提供要更新的字段' })
      return
    }

    fields.push('updated_at = datetime(\'now\',\'localtime\')')
    values.push(id)

    db.run(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`, values)
    saveDb()

    const stmt = db.prepare('SELECT * FROM tags WHERE id = ?')
    stmt.bind([id])
    let tag: Record<string, unknown> | null = null
    if (stmt.step()) {
      tag = stmt.getAsObject()
    }
    stmt.free()

    res.json({ success: true, data: tag })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新标签失败' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const checkStmt = db.prepare('SELECT id FROM tags WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '标签不存在' })
      return
    }
    checkStmt.free()

    db.run('DELETE FROM tags WHERE id = ?', [id])
    saveDb()

    res.json({ success: true, message: '标签已删除' })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除标签失败' })
  }
})

router.get('/:id/samples', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const checkStmt = db.prepare('SELECT id FROM tags WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '标签不存在' })
      return
    }
    checkStmt.free()

    const stmt = db.prepare(`
      SELECT s.* FROM samples s
      INNER JOIN sample_tags st ON s.id = st.sample_id
      WHERE st.tag_id = ?
      ORDER BY s.created_at DESC
    `)
    stmt.bind([id])
    const results: Record<string, unknown>[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()

    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取标签关联样本失败' })
  }
})

export default router
