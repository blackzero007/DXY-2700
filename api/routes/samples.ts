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

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string | undefined
    let sql: string
    let stmt: ReturnType<typeof db.prepare>

    if (search) {
      sql = 'SELECT * FROM samples WHERE code LIKE ? ORDER BY created_at DESC'
      stmt = db.prepare(sql)
      stmt.bind([`%${search}%`])
    } else {
      sql = 'SELECT * FROM samples ORDER BY created_at DESC'
      stmt = db.prepare(sql)
      stmt.bind([])
    }

    const results: Record<string, unknown>[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()

    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取样本列表失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, type, source } = req.body

    if (!code || !name || !type || !source) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const existing = db.prepare('SELECT id FROM samples WHERE code = ?')
    existing.bind([code])
    if (existing.step()) {
      existing.free()
      res.status(409).json({ success: false, error: '样本编号已存在' })
      return
    }
    existing.free()

    db.run(
      'INSERT INTO samples (code, name, type, source) VALUES (?, ?, ?, ?)',
      [code, name, type, source]
    )

    const sampleId = getLastInsertId()

    db.run(
      'INSERT INTO transitions (sample_id, node_name, operator, note) VALUES (?, ?, ?, ?)',
      [sampleId, SampleStatus.REGISTERED, '系统', '样本登记']
    )

    saveDb()

    const stmt = db.prepare('SELECT * FROM samples WHERE id = ?')
    stmt.bind([sampleId])
    let sample: Record<string, unknown> | null = null
    if (stmt.step()) {
      sample = stmt.getAsObject()
    }
    stmt.free()

    res.status(201).json({ success: true, data: sample })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建样本失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const sampleStmt = db.prepare('SELECT * FROM samples WHERE id = ?')
    sampleStmt.bind([id])
    let sample: Record<string, unknown> | null = null
    if (sampleStmt.step()) {
      sample = sampleStmt.getAsObject()
    }
    sampleStmt.free()

    if (!sample) {
      res.status(404).json({ success: false, error: '样本不存在' })
      return
    }

    const transStmt = db.prepare('SELECT * FROM transitions WHERE sample_id = ? ORDER BY created_at ASC')
    transStmt.bind([id])
    const transitions: Record<string, unknown>[] = []
    while (transStmt.step()) {
      transitions.push(transStmt.getAsObject())
    }
    transStmt.free()

    res.json({ success: true, data: { ...sample, transitions } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取样本详情失败' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const { status } = req.body

    const validStatuses = Object.values(SampleStatus) as string[]
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: '无效的状态值' })
      return
    }

    const checkStmt = db.prepare('SELECT id FROM samples WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '样本不存在' })
      return
    }
    checkStmt.free()

    db.run(
      'UPDATE samples SET status = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?',
      [status, id]
    )

    saveDb()

    const stmt = db.prepare('SELECT * FROM samples WHERE id = ?')
    stmt.bind([id])
    let sample: Record<string, unknown> | null = null
    if (stmt.step()) {
      sample = stmt.getAsObject()
    }
    stmt.free()

    res.json({ success: true, data: sample })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新样本失败' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const checkStmt = db.prepare('SELECT id FROM samples WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '样本不存在' })
      return
    }
    checkStmt.free()

    db.run('DELETE FROM transitions WHERE sample_id = ?', [id])
    db.run('DELETE FROM samples WHERE id = ?', [id])

    saveDb()

    res.json({ success: true, message: '样本已删除' })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除样本失败' })
  }
})

router.post('/:id/transitions', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const { node_name, operator, note } = req.body

    if (!node_name || !operator) {
      res.status(400).json({ success: false, error: '缺少必填字段：节点名称和操作人' })
      return
    }

    const checkStmt = db.prepare('SELECT id FROM samples WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '样本不存在' })
      return
    }
    checkStmt.free()

    db.run(
      'INSERT INTO transitions (sample_id, node_name, operator, note) VALUES (?, ?, ?, ?)',
      [id, node_name, operator, note || '']
    )

    const transitionId = getLastInsertId()

    saveDb()

    const stmt = db.prepare('SELECT * FROM transitions WHERE id = ?')
    stmt.bind([transitionId])
    let transition: Record<string, unknown> | null = null
    if (stmt.step()) {
      transition = stmt.getAsObject()
    }
    stmt.free()

    res.status(201).json({ success: true, data: transition })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建流转记录失败' })
  }
})

export default router
