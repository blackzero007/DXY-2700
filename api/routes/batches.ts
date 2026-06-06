import { Router, type Request, type Response } from 'express'
import { db, saveDb } from '../db.js'
import { SampleStatus } from '../../shared/types.js'

const router = Router()

function getLastInsertId(): number {
  const stmt = db.prepare('SELECT last_insert_rowid() as id')
  stmt.step()
  const row = stmt.getAsObject() as { id: number }
  stmt.free()
  return row.id
}

function getBatchStats(batchId: number): { total: number; completed: number; discarded: number } {
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM samples WHERE batch_id = ?')
  totalStmt.bind([batchId])
  let total = 0
  if (totalStmt.step()) {
    const row = totalStmt.getAsObject() as { count: number }
    total = row.count
  }
  totalStmt.free()

  const completedStmt = db.prepare('SELECT COUNT(*) as count FROM samples WHERE batch_id = ? AND status = ?')
  completedStmt.bind([batchId, SampleStatus.COMPLETED])
  let completed = 0
  if (completedStmt.step()) {
    const row = completedStmt.getAsObject() as { count: number }
    completed = row.count
  }
  completedStmt.free()

  const discardedStmt = db.prepare('SELECT COUNT(*) as count FROM samples WHERE batch_id = ? AND status = ?')
  discardedStmt.bind([batchId, SampleStatus.DISCARDED])
  let discarded = 0
  if (discardedStmt.step()) {
    const row = discardedStmt.getAsObject() as { count: number }
    discarded = row.count
  }
  discardedStmt.free()

  return { total, completed, discarded }
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string | undefined
    let sql: string
    let stmt: ReturnType<typeof db.prepare>

    if (search) {
      sql = 'SELECT * FROM batches WHERE code LIKE ? OR name LIKE ? ORDER BY created_at DESC'
      stmt = db.prepare(sql)
      stmt.bind([`%${search}%`, `%${search}%`])
    } else {
      sql = 'SELECT * FROM batches ORDER BY created_at DESC'
      stmt = db.prepare(sql)
      stmt.bind([])
    }

    const batches: Record<string, unknown>[] = []
    while (stmt.step()) {
      batches.push(stmt.getAsObject())
    }
    stmt.free()

    const batchesWithStats = batches.map((batch) => {
      const id = batch.id as number
      const stats = getBatchStats(id)
      return { ...batch, stats }
    })

    res.json({ success: true, data: batchesWithStats })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取批次列表失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, type, description } = req.body

    if (!code || !name || !type) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const existing = db.prepare('SELECT id FROM batches WHERE code = ?')
    existing.bind([code])
    if (existing.step()) {
      existing.free()
      res.status(409).json({ success: false, error: '批次编号已存在' })
      return
    }
    existing.free()

    db.run(
      'INSERT INTO batches (code, name, type, description) VALUES (?, ?, ?, ?)',
      [code, name, type, description || '']
    )

    const batchId = getLastInsertId()
    saveDb()

    const stmt = db.prepare('SELECT * FROM batches WHERE id = ?')
    stmt.bind([batchId])
    let batch: Record<string, unknown> | null = null
    if (stmt.step()) {
      batch = stmt.getAsObject()
    }
    stmt.free()

    const stats = getBatchStats(batchId)

    res.status(201).json({ success: true, data: { ...batch, stats } })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建批次失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const batchStmt = db.prepare('SELECT * FROM batches WHERE id = ?')
    batchStmt.bind([id])
    let batch: Record<string, unknown> | null = null
    if (batchStmt.step()) {
      batch = batchStmt.getAsObject()
    }
    batchStmt.free()

    if (!batch) {
      res.status(404).json({ success: false, error: '批次不存在' })
      return
    }

    const stats = getBatchStats(id)

    res.json({ success: true, data: { ...batch, stats } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取批次详情失败' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const { name, type, description } = req.body

    const checkStmt = db.prepare('SELECT id FROM batches WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '批次不存在' })
      return
    }
    checkStmt.free()

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
    if (description !== undefined) {
      fields.push('description = ?')
      values.push(description)
    }

    if (fields.length > 0) {
      fields.push('updated_at = datetime(\'now\',\'localtime\')')
      values.push(id)
      db.run(`UPDATE batches SET ${fields.join(', ')} WHERE id = ?`, values)
      saveDb()
    }

    const stmt = db.prepare('SELECT * FROM batches WHERE id = ?')
    stmt.bind([id])
    let batch: Record<string, unknown> | null = null
    if (stmt.step()) {
      batch = stmt.getAsObject()
    }
    stmt.free()

    const stats = getBatchStats(id)

    res.json({ success: true, data: { ...batch, stats } })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新批次失败' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const checkStmt = db.prepare('SELECT id FROM batches WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '批次不存在' })
      return
    }
    checkStmt.free()

    db.run('DELETE FROM batches WHERE id = ?', [id])
    saveDb()

    res.json({ success: true, message: '批次已删除' })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除批次失败' })
  }
})

router.get('/:id/samples', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const checkStmt = db.prepare('SELECT id FROM batches WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '批次不存在' })
      return
    }
    checkStmt.free()

    const stmt = db.prepare('SELECT * FROM samples WHERE batch_id = ? ORDER BY created_at DESC')
    stmt.bind([id])
    const samples: Record<string, unknown>[] = []
    while (stmt.step()) {
      samples.push(stmt.getAsObject())
    }
    stmt.free()

    res.json({ success: true, data: samples })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取批次样本失败' })
  }
})

export default router
