import { Router, type Request, type Response } from 'express'
import { db, saveDb } from '../db.js'
import { SampleStatus, type SampleStats } from '../../shared/types.js'

const router = Router()

function getLastInsertId(): number {
  const stmt = db.prepare('SELECT last_insert_rowid() as id')
  stmt.step()
  const row = stmt.getAsObject() as { id: number }
  stmt.free()
  return row.id
}

function getTagsForSample(sampleId: number): Record<string, unknown>[] {
  const tagStmt = db.prepare(`
    SELECT t.* FROM tags t
    INNER JOIN sample_tags st ON t.id = st.tag_id
    WHERE st.sample_id = ?
    ORDER BY t.created_at ASC
  `)
  tagStmt.bind([sampleId])
  const tags: Record<string, unknown>[] = []
  while (tagStmt.step()) {
    tags.push(tagStmt.getAsObject())
  }
  tagStmt.free()
  return tags
}

function getAttachmentsForSample(sampleId: number): Record<string, unknown>[] {
  const attStmt = db.prepare(`
    SELECT * FROM sample_attachments
    WHERE sample_id = ?
    ORDER BY created_at DESC
  `)
  attStmt.bind([sampleId])
  const attachments: Record<string, unknown>[] = []
  while (attStmt.step()) {
    attachments.push(attStmt.getAsObject())
  }
  attStmt.free()
  return attachments
}

router.get('/archived', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string | undefined
    const conditions: string[] = ['s.status = ?']
    const params: unknown[] = [SampleStatus.ARCHIVED]

    if (search) {
      conditions.push('(s.code LIKE ? OR s.name LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }

    const sql = `
      SELECT 
        s.*,
        t.created_at as archived_at,
        t.operator as archived_by,
        t.note as archive_note
      FROM samples s
      LEFT JOIN transitions t ON t.sample_id = s.id 
        AND t.node_name = ?
        AND t.id = (
          SELECT id FROM transitions 
          WHERE sample_id = s.id AND node_name = ? 
          ORDER BY created_at DESC LIMIT 1
        )
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.created_at DESC
    `

    const stmt = db.prepare(sql)
    stmt.bind([SampleStatus.ARCHIVED, SampleStatus.ARCHIVED, ...params])

    const results: Record<string, unknown>[] = []
    while (stmt.step()) {
      const sample = stmt.getAsObject()
      const sampleId = sample.id as number
      const tags = getTagsForSample(sampleId)
      results.push({ ...sample, tags })
    }
    stmt.free()

    res.json({ success: true, data: results })
  } catch (_error) {
    res.status(500).json({ success: false, error: '获取归档样本列表失败' })
  }
})

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const statusCounts: Record<string, number> = {}
    const statusValues = Object.values(SampleStatus) as string[]
    for (const status of statusValues) {
      statusCounts[status] = 0
    }

    const statusStmt = db.prepare('SELECT status, COUNT(*) as count FROM samples GROUP BY status')
    while (statusStmt.step()) {
      const row = statusStmt.getAsObject() as { status: string; count: number }
      statusCounts[row.status] = row.count
    }
    statusStmt.free()

    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM samples')
    totalStmt.step()
    const totalRow = totalStmt.getAsObject() as { count: number }
    const total = totalRow.count
    totalStmt.free()

    const todayStmt = db.prepare('SELECT COUNT(*) as count FROM samples WHERE DATE(created_at) = DATE(\'now\',\'localtime\')')
    todayStmt.step()
    const todayRow = todayStmt.getAsObject() as { count: number }
    const todayNew = todayRow.count
    todayStmt.free()

    const completedStmt = db.prepare('SELECT COUNT(*) as count FROM samples WHERE status = ?')
    completedStmt.bind([SampleStatus.COMPLETED])
    completedStmt.step()
    const completedRow = completedStmt.getAsObject() as { count: number }
    const completed = completedRow.count
    completedStmt.free()

    const discardedStmt = db.prepare('SELECT COUNT(*) as count FROM samples WHERE status = ?')
    discardedStmt.bind([SampleStatus.DISCARDED])
    discardedStmt.step()
    const discardedRow = discardedStmt.getAsObject() as { count: number }
    const discarded = discardedRow.count
    discardedStmt.free()

    const stats: SampleStats = {
      total,
      statusCounts: statusCounts as Record<SampleStatus, number>,
      todayNew,
      completed,
      discarded,
    }

    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取样本统计失败' })
  }
})

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string | undefined
    const batchId = req.query.batch_id as string | undefined
    const tagId = req.query.tag_id as string | undefined
    const conditions: string[] = []
    const params: unknown[] = []

    if (search) {
      conditions.push('s.code LIKE ?')
      params.push(`%${search}%`)
    }

    if (batchId) {
      conditions.push('s.batch_id = ?')
      params.push(Number(batchId))
    }

    if (tagId) {
      conditions.push('s.id IN (SELECT sample_id FROM sample_tags WHERE tag_id = ?)')
      params.push(Number(tagId))
    }

    let sql = 'SELECT s.* FROM samples s'
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    sql += ' ORDER BY s.created_at DESC'

    const stmt = db.prepare(sql)
    stmt.bind(params)

    const results: Record<string, unknown>[] = []
    while (stmt.step()) {
      const sample = stmt.getAsObject()
      const sampleId = sample.id as number
      const tags = getTagsForSample(sampleId)
      results.push({ ...sample, tags })
    }
    stmt.free()

    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取样本列表失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, name, type, source, batch_id } = req.body

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

    if (batch_id) {
      const batchCheck = db.prepare('SELECT id FROM batches WHERE id = ?')
      batchCheck.bind([batch_id])
      if (!batchCheck.step()) {
        batchCheck.free()
        res.status(400).json({ success: false, error: '批次不存在' })
        return
      }
      batchCheck.free()
    }

    db.run(
      'INSERT INTO samples (code, name, type, source, batch_id) VALUES (?, ?, ?, ?, ?)',
      [code, name, type, source, batch_id || null]
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

router.get('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string | undefined
    const batchId = req.query.batch_id as string | undefined
    const tagId = req.query.tag_id as string | undefined
    const conditions: string[] = []
    const params: unknown[] = []

    if (search) {
      conditions.push('s.code LIKE ?')
      params.push('%' + search + '%')
    }

    if (batchId) {
      conditions.push('s.batch_id = ?')
      params.push(Number(batchId))
    }

    if (tagId) {
      conditions.push('s.id IN (SELECT sample_id FROM sample_tags WHERE tag_id = ?)')
      params.push(Number(tagId))
    }

    let sql = 'SELECT s.*, b.name as batch_name FROM samples s LEFT JOIN batches b ON s.batch_id = b.id'
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' ORDER BY s.created_at DESC'

    const stmt = db.prepare(sql)
    stmt.bind(params)

    const samples: Record<string, unknown>[] = []
    while (stmt.step()) {
      const sample = stmt.getAsObject()
      const sampleId = sample.id as number
      const tags = getTagsForSample(sampleId)
      const tagNames = tags.map((t) => t.name as string).join('、')
      samples.push({ ...sample, tag_names: tagNames })
    }
    stmt.free()

    const headers = ['编号', '名称', '类型', '来源', '状态', '批次', '标签', '创建时间', '更新时间']

    function escapeCsv(cell: unknown): string {
      const cellStr = String(cell ?? '')
      if (cellStr.indexOf(',') >= 0 || cellStr.indexOf('"') >= 0 || cellStr.indexOf('\n') >= 0) {
        return '"' + cellStr.replace(/"/g, '""') + '"'
      }
      return cellStr
    }

    const headerLine = headers.map(escapeCsv).join(',')

    const lines: string[] = [headerLine]
    for (const sample of samples) {
      const row = [
        sample.code,
        sample.name,
        sample.type,
        sample.source,
        sample.status,
        sample.batch_name || '',
        sample.tag_names,
        sample.created_at,
        sample.updated_at,
      ]
      lines.push(row.map(escapeCsv).join(','))
    }

    const csvContent = '\uFEFF' + lines.join('\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="samples.csv"')
    res.send(csvContent)
  } catch (error) {
    res.status(500).json({ success: false, error: '导出样本失败' })
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

    const tags = getTagsForSample(id)
    const attachments = getAttachmentsForSample(id)

    res.json({ success: true, data: { ...sample, transitions, tags, attachments } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取样本详情失败' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const { status, batch_id, operator, note } = req.body

    const checkStmt = db.prepare('SELECT id, status FROM samples WHERE id = ?')
    checkStmt.bind([id])
    let oldSample: Record<string, unknown> | null = null
    if (checkStmt.step()) {
      oldSample = checkStmt.getAsObject()
    }
    checkStmt.free()

    if (!oldSample) {
      res.status(404).json({ success: false, error: '样本不存在' })
      return
    }

    const fields: string[] = []
    const values: unknown[] = []
    let statusChanged = false

    if (status !== undefined) {
      const validStatuses = Object.values(SampleStatus) as string[]
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, error: '无效的状态值' })
        return
      }
      if (oldSample.status !== status) {
        statusChanged = true
      }
      fields.push('status = ?')
      values.push(status)
    }

    if (batch_id !== undefined) {
      if (batch_id !== null) {
        const batchCheck = db.prepare('SELECT id FROM batches WHERE id = ?')
        batchCheck.bind([batch_id])
        if (!batchCheck.step()) {
          batchCheck.free()
          res.status(400).json({ success: false, error: '批次不存在' })
          return
        }
        batchCheck.free()
      }
      fields.push('batch_id = ?')
      values.push(batch_id)
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, error: '没有提供要更新的字段' })
      return
    }

    if (statusChanged && !operator) {
      res.status(400).json({ success: false, error: '状态变更时必须提供操作人' })
      return
    }

    fields.push('updated_at = datetime(\'now\',\'localtime\')')
    values.push(id)

    db.run(`UPDATE samples SET ${fields.join(', ')} WHERE id = ?`, values)

    if (statusChanged && operator) {
      db.run(
        'INSERT INTO transitions (sample_id, node_name, operator, note) VALUES (?, ?, ?, ?)',
        [id, status, operator, note || '']
      )
    }

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
    db.run('DELETE FROM sample_exceptions WHERE sample_id = ?', [id])
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

router.get('/:id/tags', async (req: Request, res: Response): Promise<void> => {
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

    const tags = getTagsForSample(id)

    res.json({ success: true, data: tags })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取样本标签失败' })
  }
})

router.post('/:id/tags/:tagId', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const tagId = Number(req.params.tagId)

    const sampleCheck = db.prepare('SELECT id FROM samples WHERE id = ?')
    sampleCheck.bind([id])
    if (!sampleCheck.step()) {
      sampleCheck.free()
      res.status(404).json({ success: false, error: '样本不存在' })
      return
    }
    sampleCheck.free()

    const tagCheck = db.prepare('SELECT id FROM tags WHERE id = ?')
    tagCheck.bind([tagId])
    if (!tagCheck.step()) {
      tagCheck.free()
      res.status(404).json({ success: false, error: '标签不存在' })
      return
    }
    tagCheck.free()

    const existing = db.prepare('SELECT 1 FROM sample_tags WHERE sample_id = ? AND tag_id = ?')
    existing.bind([id, tagId])
    if (existing.step()) {
      existing.free()
      res.status(409).json({ success: false, error: '样本已拥有该标签' })
      return
    }
    existing.free()

    db.run('INSERT INTO sample_tags (sample_id, tag_id) VALUES (?, ?)', [id, tagId])
    saveDb()

    const tags = getTagsForSample(id)

    res.status(201).json({ success: true, data: tags, message: '标签添加成功' })
  } catch (error) {
    res.status(500).json({ success: false, error: '添加标签失败' })
  }
})

router.delete('/:id/tags/:tagId', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const tagId = Number(req.params.tagId)

    const sampleCheck = db.prepare('SELECT id FROM samples WHERE id = ?')
    sampleCheck.bind([id])
    if (!sampleCheck.step()) {
      sampleCheck.free()
      res.status(404).json({ success: false, error: '样本不存在' })
      return
    }
    sampleCheck.free()

    const existing = db.prepare('SELECT 1 FROM sample_tags WHERE sample_id = ? AND tag_id = ?')
    existing.bind([id, tagId])
    if (!existing.step()) {
      existing.free()
      res.status(404).json({ success: false, error: '样本没有该标签' })
      return
    }
    existing.free()

    db.run('DELETE FROM sample_tags WHERE sample_id = ? AND tag_id = ?', [id, tagId])
    saveDb()

    const tags = getTagsForSample(id)

    res.json({ success: true, data: tags, message: '标签移除成功' })
  } catch (error) {
    res.status(500).json({ success: false, error: '移除标签失败' })
  }
})

router.get('/:id/attachments', async (req: Request, res: Response): Promise<void> => {
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

    const attachments = getAttachmentsForSample(id)

    res.json({ success: true, data: attachments })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取附件列表失败' })
  }
})

router.post('/:id/attachments', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const { name, type, note } = req.body

    if (!name || !type) {
      res.status(400).json({ success: false, error: '缺少必填字段：名称和类型' })
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
      'INSERT INTO sample_attachments (sample_id, name, type, note) VALUES (?, ?, ?, ?)',
      [id, name, type, note || '']
    )

    const attachmentId = getLastInsertId()

    saveDb()

    const stmt = db.prepare('SELECT * FROM sample_attachments WHERE id = ?')
    stmt.bind([attachmentId])
    let attachment: Record<string, unknown> | null = null
    if (stmt.step()) {
      attachment = stmt.getAsObject()
    }
    stmt.free()

    res.status(201).json({ success: true, data: attachment })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建附件失败' })
  }
})

router.put('/:id/attachments/:attachmentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const attachmentId = Number(req.params.attachmentId)
    const { name, type, note } = req.body

    const sampleCheck = db.prepare('SELECT id FROM samples WHERE id = ?')
    sampleCheck.bind([id])
    if (!sampleCheck.step()) {
      sampleCheck.free()
      res.status(404).json({ success: false, error: '样本不存在' })
      return
    }
    sampleCheck.free()

    const attCheck = db.prepare('SELECT id FROM sample_attachments WHERE id = ? AND sample_id = ?')
    attCheck.bind([attachmentId, id])
    if (!attCheck.step()) {
      attCheck.free()
      res.status(404).json({ success: false, error: '附件不存在' })
      return
    }
    attCheck.free()

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
    if (note !== undefined) {
      fields.push('note = ?')
      values.push(note)
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, error: '没有提供要更新的字段' })
      return
    }

    fields.push('updated_at = datetime(\'now\',\'localtime\')')
    values.push(attachmentId)

    db.run(`UPDATE sample_attachments SET ${fields.join(', ')} WHERE id = ?`, values)

    saveDb()

    const stmt = db.prepare('SELECT * FROM sample_attachments WHERE id = ?')
    stmt.bind([attachmentId])
    let attachment: Record<string, unknown> | null = null
    if (stmt.step()) {
      attachment = stmt.getAsObject()
    }
    stmt.free()

    res.json({ success: true, data: attachment })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新附件失败' })
  }
})

router.delete('/:id/attachments/:attachmentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    const attachmentId = Number(req.params.attachmentId)

    const sampleCheck = db.prepare('SELECT id FROM samples WHERE id = ?')
    sampleCheck.bind([id])
    if (!sampleCheck.step()) {
      sampleCheck.free()
      res.status(404).json({ success: false, error: '样本不存在' })
      return
    }
    sampleCheck.free()

    const attCheck = db.prepare('SELECT id FROM sample_attachments WHERE id = ? AND sample_id = ?')
    attCheck.bind([attachmentId, id])
    if (!attCheck.step()) {
      attCheck.free()
      res.status(404).json({ success: false, error: '附件不存在' })
      return
    }
    attCheck.free()

    db.run('DELETE FROM sample_attachments WHERE id = ?', [attachmentId])

    saveDb()

    res.json({ success: true, message: '附件已删除' })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除附件失败' })
  }
})

export default router
