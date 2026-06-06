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
    const stmt = db.prepare('SELECT * FROM operators ORDER BY created_at ASC')
    const results: Record<string, unknown>[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()

    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取实验人员列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const stmt = db.prepare('SELECT * FROM operators WHERE id = ?')
    stmt.bind([id])
    let operator: Record<string, unknown> | null = null
    if (stmt.step()) {
      operator = stmt.getAsObject()
    }
    stmt.free()

    if (!operator) {
      res.status(404).json({ success: false, error: '实验人员不存在' })
      return
    }

    res.json({ success: true, data: operator })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取实验人员详情失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, employee_id, team } = req.body

    if (!name || !employee_id) {
      res.status(400).json({ success: false, error: '姓名和工号不能为空' })
      return
    }

    const existing = db.prepare('SELECT id FROM operators WHERE employee_id = ?')
    existing.bind([employee_id])
    if (existing.step()) {
      existing.free()
      res.status(409).json({ success: false, error: '工号已存在' })
      return
    }
    existing.free()

    db.run(
      'INSERT INTO operators (name, employee_id, team) VALUES (?, ?, ?)',
      [name, employee_id, team || '']
    )

    const operatorId = getLastInsertId()
    saveDb()

    const stmt = db.prepare('SELECT * FROM operators WHERE id = ?')
    stmt.bind([operatorId])
    let operator: Record<string, unknown> | null = null
    if (stmt.step()) {
      operator = stmt.getAsObject()
    }
    stmt.free()

    res.status(201).json({ success: true, data: operator })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建实验人员失败' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const { name, employee_id, team } = req.body

    const checkStmt = db.prepare('SELECT id FROM operators WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '实验人员不存在' })
      return
    }
    checkStmt.free()

    if (employee_id) {
      const idCheck = db.prepare('SELECT id FROM operators WHERE employee_id = ? AND id != ?')
      idCheck.bind([employee_id, id])
      if (idCheck.step()) {
        idCheck.free()
        res.status(409).json({ success: false, error: '工号已存在' })
        return
      }
      idCheck.free()
    }

    const fields: string[] = []
    const values: unknown[] = []

    if (name !== undefined) {
      fields.push('name = ?')
      values.push(name)
    }
    if (employee_id !== undefined) {
      fields.push('employee_id = ?')
      values.push(employee_id)
    }
    if (team !== undefined) {
      fields.push('team = ?')
      values.push(team)
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, error: '没有提供要更新的字段' })
      return
    }

    fields.push('updated_at = datetime(\'now\',\'localtime\')')
    values.push(id)

    db.run(`UPDATE operators SET ${fields.join(', ')} WHERE id = ?`, values)
    saveDb()

    const stmt = db.prepare('SELECT * FROM operators WHERE id = ?')
    stmt.bind([id])
    let operator: Record<string, unknown> | null = null
    if (stmt.step()) {
      operator = stmt.getAsObject()
    }
    stmt.free()

    res.json({ success: true, data: operator })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新实验人员失败' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const checkStmt = db.prepare('SELECT id FROM operators WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '实验人员不存在' })
      return
    }
    checkStmt.free()

    db.run('DELETE FROM operators WHERE id = ?', [id])
    saveDb()

    res.json({ success: true, message: '实验人员已删除' })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除实验人员失败' })
  }
})

export default router
