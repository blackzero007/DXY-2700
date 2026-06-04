import { Router, type Request, type Response } from 'express'
import { db, saveDb } from '../db.js'
import { SampleStatus } from '../../shared/types.js'

const router = Router()

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
    res.status(500).json({ success: false, error: 'Failed to fetch samples' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, type, source } = req.body

    if (!code || !name || !type || !source) {
      res.status(400).json({ success: false, error: 'Missing required fields' })
      return
    }

    const existing = db.prepare('SELECT id FROM samples WHERE code = ?')
    existing.bind([code])
    if (existing.step()) {
      existing.free()
      res.status(409).json({ success: false, error: 'Sample code already exists' })
      return
    }
    existing.free()

    const insertResult = db.run(
      'INSERT INTO samples (code, name, type, source) VALUES (?, ?, ?, ?)',
      [code, name, type, source]
    )

    const sampleId = insertResult.lastInsertRowid as number

    db.run(
      'INSERT INTO transitions (sample_id, node_name, operator, note) VALUES (?, ?, ?, ?)',
      [sampleId, SampleStatus.REGISTERED, 'system', 'Sample registered']
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
    res.status(500).json({ success: false, error: 'Failed to create sample' })
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
      res.status(404).json({ success: false, error: 'Sample not found' })
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
    res.status(500).json({ success: false, error: 'Failed to fetch sample' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const { status } = req.body

    const validStatuses = Object.values(SampleStatus) as string[]
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status value' })
      return
    }

    const checkStmt = db.prepare('SELECT id FROM samples WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: 'Sample not found' })
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
    res.status(500).json({ success: false, error: 'Failed to update sample' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const checkStmt = db.prepare('SELECT id FROM samples WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: 'Sample not found' })
      return
    }
    checkStmt.free()

    db.run('DELETE FROM transitions WHERE sample_id = ?', [id])
    db.run('DELETE FROM samples WHERE id = ?', [id])

    saveDb()

    res.json({ success: true, message: 'Sample deleted' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete sample' })
  }
})

router.post('/:id/transitions', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const { node_name, operator, note } = req.body

    if (!node_name || !operator) {
      res.status(400).json({ success: false, error: 'Missing required fields: node_name and operator' })
      return
    }

    const checkStmt = db.prepare('SELECT id FROM samples WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: 'Sample not found' })
      return
    }
    checkStmt.free()

    const insertResult = db.run(
      'INSERT INTO transitions (sample_id, node_name, operator, note) VALUES (?, ?, ?, ?)',
      [id, node_name, operator, note || '']
    )

    const transitionId = insertResult.lastInsertRowid as number

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
    res.status(500).json({ success: false, error: 'Failed to create transition' })
  }
})

export default router
