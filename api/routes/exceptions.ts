import { Router, type Request, type Response } from 'express'
import { db, saveDb } from '../db.js'
import { ExceptionType, ExceptionStatus } from '../../shared/types.js'

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
    const sampleId = req.query.sample_id as string | undefined
    const type = req.query.type as string | undefined
    const status = req.query.status as string | undefined
    const conditions: string[] = []
    const params: unknown[] = []

    if (sampleId) {
      conditions.push('se.sample_id = ?')
      params.push(Number(sampleId))
    }

    if (type) {
      conditions.push('se.type = ?')
      params.push(type)
    }

    if (status) {
      conditions.push('se.status = ?')
      params.push(status)
    }

    let sql = `
      SELECT se.*, s.code as sample_code, s.name as sample_name
      FROM sample_exceptions se
      LEFT JOIN samples s ON se.sample_id = s.id
    `
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    sql += ' ORDER BY se.created_at DESC'

    const stmt = db.prepare(sql)
    stmt.bind(params)

    const results: Record<string, unknown>[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()

    res.json({ success: true, data: results })
  } catch (_error) {
    res.status(500).json({ success: false, error: '获取异常列表失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sample_id, type, title, description, reporter } = req.body

    if (!sample_id || !type || !title || !reporter) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const validTypes = Object.values(ExceptionType) as string[]
    if (!validTypes.includes(type)) {
      res.status(400).json({ success: false, error: '无效的异常类型' })
      return
    }

    const sampleCheck = db.prepare('SELECT id FROM samples WHERE id = ?')
    sampleCheck.bind([sample_id])
    if (!sampleCheck.step()) {
      sampleCheck.free()
      res.status(400).json({ success: false, error: '样本不存在' })
      return
    }
    sampleCheck.free()

    db.run(
      'INSERT INTO sample_exceptions (sample_id, type, title, description, reporter) VALUES (?, ?, ?, ?, ?)',
      [sample_id, type, title, description || '', reporter]
    )

    const exceptionId = getLastInsertId()
    saveDb()

    const stmt = db.prepare(`
      SELECT se.*, s.code as sample_code, s.name as sample_name
      FROM sample_exceptions se
      LEFT JOIN samples s ON se.sample_id = s.id
      WHERE se.id = ?
    `)
    stmt.bind([exceptionId])
    let exception: Record<string, unknown> | null = null
    if (stmt.step()) {
      exception = stmt.getAsObject()
    }
    stmt.free()

    res.status(201).json({ success: true, data: exception })
  } catch (_error) {
    res.status(500).json({ success: false, error: '创建异常记录失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const stmt = db.prepare(`
      SELECT se.*, s.code as sample_code, s.name as sample_name
      FROM sample_exceptions se
      LEFT JOIN samples s ON se.sample_id = s.id
      WHERE se.id = ?
    `)
    stmt.bind([id])
    let exception: Record<string, unknown> | null = null
    if (stmt.step()) {
      exception = stmt.getAsObject()
    }
    stmt.free()

    if (!exception) {
      res.status(404).json({ success: false, error: '异常记录不存在' })
      return
    }

    res.json({ success: true, data: exception })
  } catch (_error) {
    res.status(500).json({ success: false, error: '获取异常详情失败' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const { type, title, description, status, handler, resolution } = req.body

    const checkStmt = db.prepare('SELECT id, status FROM sample_exceptions WHERE id = ?')
    checkStmt.bind([id])
    let currentException: Record<string, unknown> | null = null
    if (checkStmt.step()) {
      currentException = checkStmt.getAsObject()
    }
    checkStmt.free()

    if (!currentException) {
      res.status(404).json({ success: false, error: '异常记录不存在' })
      return
    }

    if (type !== undefined) {
      const validTypes = Object.values(ExceptionType) as string[]
      if (!validTypes.includes(type)) {
        res.status(400).json({ success: false, error: '无效的异常类型' })
        return
      }
    }

    if (status !== undefined) {
      const validStatuses = Object.values(ExceptionStatus) as string[]
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, error: '无效的状态值' })
        return
      }
    }

    const fields: string[] = []
    const values: unknown[] = []

    if (type !== undefined) {
      fields.push('type = ?')
      values.push(type)
    }
    if (title !== undefined) {
      fields.push('title = ?')
      values.push(title)
    }
    if (description !== undefined) {
      fields.push('description = ?')
      values.push(description)
    }
    if (status !== undefined) {
      fields.push('status = ?')
      values.push(status)
      if (status === ExceptionStatus.RESOLVED || status === ExceptionStatus.CLOSED) {
        fields.push('resolved_at = datetime(\'now\',\'localtime\')')
      } else {
        fields.push('resolved_at = NULL')
      }
    }
    if (handler !== undefined) {
      fields.push('handler = ?')
      values.push(handler)
    }
    if (resolution !== undefined) {
      fields.push('resolution = ?')
      values.push(resolution)
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, error: '没有提供要更新的字段' })
      return
    }

    fields.push('updated_at = datetime(\'now\',\'localtime\')')
    values.push(id)

    db.run(`UPDATE sample_exceptions SET ${fields.join(', ')} WHERE id = ?`, values)
    saveDb()

    const stmt = db.prepare(`
      SELECT se.*, s.code as sample_code, s.name as sample_name
      FROM sample_exceptions se
      LEFT JOIN samples s ON se.sample_id = s.id
      WHERE se.id = ?
    `)
    stmt.bind([id])
    let exception: Record<string, unknown> | null = null
    if (stmt.step()) {
      exception = stmt.getAsObject()
    }
    stmt.free()

    res.json({ success: true, data: exception })
  } catch (_error) {
    res.status(500).json({ success: false, error: '更新异常记录失败' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)

    const checkStmt = db.prepare('SELECT id FROM sample_exceptions WHERE id = ?')
    checkStmt.bind([id])
    if (!checkStmt.step()) {
      checkStmt.free()
      res.status(404).json({ success: false, error: '异常记录不存在' })
      return
    }
    checkStmt.free()

    db.run('DELETE FROM sample_exceptions WHERE id = ?', [id])
    saveDb()

    res.json({ success: true, message: '异常记录已删除' })
  } catch (_error) {
    res.status(500).json({ success: false, error: '删除异常记录失败' })
  }
})

export default router
