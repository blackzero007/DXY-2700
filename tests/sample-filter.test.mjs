import { spawn } from 'node:child_process'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomInt } from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

function getRandomPort() {
  return 3000 + randomInt(1000, 2000)
}

let serverProcess = null
let PORT = getRandomPort()
let BASE_URL = `http://localhost:${PORT}/api`

function startServer() {
  return new Promise((resolve, reject) => {
    const cmd = `npx tsx api/server.ts`
    serverProcess = spawn(cmd, [], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      windowsHide: true,
    })

    let started = false
    let output = ''

    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error('Server startup timeout\n' + output))
      }
    }, 20000)

    serverProcess.stdout.on('data', (data) => {
      const str = data.toString()
      output += str
      if (str.includes('Server ready') && !started) {
        started = true
        clearTimeout(timeout)
        setTimeout(resolve, 500)
      }
    })

    serverProcess.stderr.on('data', (data) => {
      output += data.toString()
    })

    serverProcess.on('error', (err) => {
      if (!started) {
        clearTimeout(timeout)
        reject(err)
      }
    })

    serverProcess.on('exit', (code) => {
      if (!started) {
        clearTimeout(timeout)
        reject(new Error(`Server exited with code ${code}\n` + output))
      }
    })
  })
}

function stopServer() {
  if (serverProcess) {
    try {
      serverProcess.kill('SIGTERM')
    } catch (e) {
      // ignore
    }
    serverProcess = null
  }
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(BASE_URL + path)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve({ status: res.statusCode, body: json })
        } catch (e) {
          resolve({ status: res.statusCode, body: data })
        }
      })
    })

    req.on('error', reject)

    if (body !== undefined) {
      req.write(JSON.stringify(body))
    }
    req.end()
  })
}

let passed = 0
let failed = 0
const testResults = []

async function test(name, fn) {
  try {
    await fn()
    console.log(`  ✓ ${name}`)
    passed++
    testResults.push({ name, passed: true })
  } catch (e) {
    console.log(`  ✗ ${name}`)
    console.log(`    ${e.message}`)
    failed++
    testResults.push({ name, passed: false, error: e.message })
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed')
  }
}

function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === ',') {
        result.push(current)
        current = ''
      } else if (char === '"') {
        inQuotes = true
      } else {
        current += char
      }
    }
  }
  result.push(current)
  return result
}

async function runTests() {
  console.log('\n样本列表筛选功能测试')
  console.log('='.repeat(50))

  const sampleIds = []
  const sampleCodes = []

  console.log('\n1. 测试数据准备')
  console.log('-'.repeat(30))

  await test('创建不同状态和类型的测试样本', async () => {
    const testSamples = [
      { code: `FILT-A-${Date.now()}`, name: '样本A-血液-已登记', type: '血液', status: '已登记' },
      { code: `FILT-B-${Date.now()}`, name: '样本B-尿液-实验中', type: '尿液', status: '实验中' },
      { code: `FILT-C-${Date.now()}`, name: '样本C-血液-已完成', type: '血液', status: '已完成' },
      { code: `FILT-D-${Date.now()}`, name: '样本D-组织-已登记', type: '组织', status: '已登记' },
      { code: `FILT-E-${Date.now()}`, name: '样本E-尿液-已完成', type: '尿液', status: '已完成' },
    ]
    for (const s of testSamples) {
      const res = await request('POST', '/samples', {
        code: s.code,
        name: s.name,
        type: s.type,
        source: '测试来源',
      })
      assert(res.status === 201, `创建样本 ${s.code} 失败`)
      sampleIds.push(res.body.data.id)
      sampleCodes.push(s.code)

      if (s.status !== '已登记') {
        const updateRes = await request('PUT', `/samples/${res.body.data.id}`, {
          status: s.status,
          operator: '测试员',
          note: '测试用',
        })
        assert(updateRes.status === 200, `更新样本状态失败: ${s.status}`)
      }
    }
  })

  console.log('\n2. 状态筛选测试')
  console.log('-'.repeat(30))

  await test('按状态筛选 - 已登记', async () => {
    const res = await request('GET', '/samples?status=已登记')
    assert(res.status === 200, '请求应成功')
    assert(res.body.success === true, '响应 success 应为 true')
    assert(Array.isArray(res.body.data), '应返回数组')
    const allRegistered = res.body.data.every(s => s.status === '已登记')
    assert(allRegistered, '所有返回样本状态应为已登记')
    assert(res.body.data.length >= 2, '至少应有2个已登记样本')
  })

  await test('按状态筛选 - 实验中', async () => {
    const res = await request('GET', '/samples?status=实验中')
    assert(res.status === 200, '请求应成功')
    const allInProgress = res.body.data.every(s => s.status === '实验中')
    assert(allInProgress, '所有返回样本状态应为实验中')
    assert(res.body.data.length >= 1, '至少应有1个实验中样本')
  })

  await test('按状态筛选 - 已完成', async () => {
    const res = await request('GET', '/samples?status=已完成')
    assert(res.status === 200, '请求应成功')
    const allCompleted = res.body.data.every(s => s.status === '已完成')
    assert(allCompleted, '所有返回样本状态应为已完成')
    assert(res.body.data.length >= 2, '至少应有2个已完成样本')
  })

  await test('按状态筛选 - 无效状态返回空列表', async () => {
    const res = await request('GET', '/samples?status=无效状态')
    assert(res.status === 200, '请求应成功')
    assert(Array.isArray(res.body.data), '应返回数组')
  })

  console.log('\n3. 样本类型筛选测试')
  console.log('-'.repeat(30))

  await test('按样本类型筛选 - 血液', async () => {
    const res = await request('GET', '/samples?sample_type=血液')
    assert(res.status === 200, '请求应成功')
    const allBlood = res.body.data.every(s => s.type === '血液')
    assert(allBlood, '所有返回样本类型应为血液')
    assert(res.body.data.length >= 2, '至少应有2个血液样本')
  })

  await test('按样本类型筛选 - 尿液', async () => {
    const res = await request('GET', '/samples?sample_type=尿液')
    assert(res.status === 200, '请求应成功')
    const allUrine = res.body.data.every(s => s.type === '尿液')
    assert(allUrine, '所有返回样本类型应为尿液')
    assert(res.body.data.length >= 2, '至少应有2个尿液样本')
  })

  await test('按样本类型筛选 - 组织', async () => {
    const res = await request('GET', '/samples?sample_type=组织')
    assert(res.status === 200, '请求应成功')
    const allTissue = res.body.data.every(s => s.type === '组织')
    assert(allTissue, '所有返回样本类型应为组织')
    assert(res.body.data.length >= 1, '至少应有1个组织样本')
  })

  console.log('\n4. 组合筛选测试')
  console.log('-'.repeat(30))

  await test('状态 + 类型组合筛选 - 已完成的血液样本', async () => {
    const res = await request('GET', '/samples?status=已完成&sample_type=血液')
    assert(res.status === 200, '请求应成功')
    const allMatch = res.body.data.every(s => s.status === '已完成' && s.type === '血液')
    assert(allMatch, '所有返回样本应为已完成且血液类型')
    assert(res.body.data.length >= 1, '至少应有1个已完成的血液样本')
  })

  await test('状态 + 类型 + 搜索组合筛选', async () => {
    const res = await request('GET', '/samples?status=已登记&sample_type=血液&search=样本A')
    assert(res.status === 200, '请求应成功')
    assert(res.body.data.length >= 1, '至少应有1条匹配结果')
    const allMatch = res.body.data.every(s =>
      s.status === '已登记' && s.type === '血液' && s.name.includes('样本A')
    )
    assert(allMatch, '所有返回样本应同时满足状态、类型和搜索条件')
  })

  console.log('\n5. 筛选 + 操作一致性测试 (Bug 修复验证)')
  console.log('-'.repeat(30))

  await test('筛选状态后新增样本，列表仍应保持筛选状态', async () => {
    const beforeRes = await request('GET', '/samples?status=已登记')
    const beforeCount = beforeRes.body.data.length

    const newRes = await request('POST', '/samples', {
      code: `FILT-NEW-${Date.now()}`,
      name: '新增测试样本',
      type: '唾液',
      source: '测试',
    })
    assert(newRes.status === 201, '新增样本应成功')
    const newSampleId = newRes.body.data.id

    const afterRes = await request('GET', '/samples?status=已登记')
    const afterCount = afterRes.body.data.length

    assert(afterCount === beforeCount + 1, `筛选下列表应增加1条，之前${beforeCount}，之后${afterCount}`)

    const allRegistered = afterRes.body.data.every(s => s.status === '已登记')
    assert(allRegistered, '所有返回样本状态应为已登记')

    await request('DELETE', `/samples/${newSampleId}`)
  })

  await test('筛选状态后更新样本状态，列表应相应变化', async () => {
    const sampleRes = await request('POST', '/samples', {
      code: `FILT-UPDATE-${Date.now()}`,
      name: '状态更新测试样本',
      type: '血液',
      source: '测试',
    })
    const sampleId = sampleRes.body.data.id

    const beforeRes = await request('GET', '/samples?status=已登记')
    const beforeCount = beforeRes.body.data.length

    const updateRes = await request('PUT', `/samples/${sampleId}`, {
      status: '已完成',
      operator: '测试员',
    })
    assert(updateRes.status === 200, '更新状态应成功')

    const afterRes = await request('GET', '/samples?status=已登记')
    const afterCount = afterRes.body.data.length

    assert(afterCount === beforeCount - 1, `已登记样本应减少1条，之前${beforeCount}，之后${afterCount}`)

    const completedRes = await request('GET', '/samples?status=已完成')
    const found = completedRes.body.data.some(s => s.id === sampleId)
    assert(found, '已完成列表中应能找到该样本')

    await request('DELETE', `/samples/${sampleId}`)
  })

  await test('筛选类型后删除样本，列表仍应保持筛选状态', async () => {
    const beforeRes = await request('GET', '/samples?sample_type=血液')
    const beforeCount = beforeRes.body.data.length

    const sampleToDelete = beforeRes.body.data[0]
    assert(sampleToDelete, '应有血液样本可删除')

    const delRes = await request('DELETE', `/samples/${sampleToDelete.id}`)
    assert(delRes.status === 200, '删除样本应成功')

    const afterRes = await request('GET', '/samples?sample_type=血液')
    const afterCount = afterRes.body.data.length

    assert(afterCount === beforeCount - 1, `血液样本应减少1条，之前${beforeCount}，之后${afterCount}`)

    const allBlood = afterRes.body.data.every(s => s.type === '血液')
    assert(allBlood, '所有返回样本类型应为血液')
  })

  await test('筛选 + 搜索 + 操作一致性', async () => {
    const newRes = await request('POST', '/samples', {
      code: `FILT-SEARCH-OP-${Date.now()}`,
      name: '搜索操作测试样本',
      type: '细胞',
      source: '测试来源',
    })
    const sampleId = newRes.body.data.id

    const searchRes = await request('GET', '/samples?search=搜索操作测试&sample_type=细胞')
    assert(searchRes.body.data.length === 1, '搜索结果应有1条')
    assert(searchRes.body.data[0].id === sampleId, '搜索结果应匹配')

    const updateRes = await request('PUT', `/samples/${sampleId}`, {
      status: '实验中',
      operator: '测试员',
    })
    assert(updateRes.status === 200, '更新状态应成功')

    const afterSearchRes = await request('GET', '/samples?search=搜索操作测试&sample_type=细胞')
    assert(afterSearchRes.body.data.length === 1, '搜索+类型筛选结果仍应为1条')
    assert(afterSearchRes.body.data[0].status === '实验中', '状态应已更新为实验中')

    await request('DELETE', `/samples/${sampleId}`)
  })

  console.log('\n6. 导出筛选一致性测试')
  console.log('-'.repeat(30))

  await test('按状态筛选后导出，CSV应只包含该状态样本', async () => {
    const res = await request('GET', '/samples/export?status=已完成')
    assert(res.status === 200, '导出请求应成功')
    assert(typeof res.body === 'string', '应返回字符串（CSV内容）')

    const lines = res.body.split('\n')
    assert(lines.length >= 2, 'CSV至少应有表头和一行数据')

    const header = lines[0]
    assert(header.includes('状态'), 'CSV表头应包含状态列')

    const headerCells = parseCsvLine(header)
    const statusIndex = headerCells.indexOf('状态')
    assert(statusIndex >= 0, '应能找到状态列索引')

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue
      const cells = parseCsvLine(lines[i])
      const status = cells[statusIndex]?.trim()
      assert(status === '已完成', `第${i}行状态应为已完成，实际为${status}`)
    }
  })

  await test('按类型筛选后导出，CSV应只包含该类型样本', async () => {
    const res = await request('GET', '/samples/export?sample_type=血液')
    assert(res.status === 200, '导出请求应成功')
    assert(typeof res.body === 'string', '应返回字符串（CSV内容）')

    const lines = res.body.split('\n')
    assert(lines.length >= 2, 'CSV至少应有表头和一行数据')

    const header = lines[0]
    const headerCells = parseCsvLine(header)
    const typeIndex = headerCells.indexOf('类型')
    assert(typeIndex >= 0, '应能找到类型列索引')

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue
      const cells = parseCsvLine(lines[i])
      const type = cells[typeIndex]?.trim()
      assert(type === '血液', `第${i}行类型应为血液，实际为${type}`)
    }
  })

  console.log('\n7. 清理测试数据')
  console.log('-'.repeat(30))

  await test('清理测试样本', async () => {
    for (const id of sampleIds) {
      const res = await request('DELETE', `/samples/${id}`)
      if (res.status !== 200 && res.status !== 404) {
        assert(false, `删除样本 ${id} 失败，状态码 ${res.status}`)
      }
    }
  })

  console.log('\n' + '='.repeat(50))
  console.log(`测试结果：通过 ${passed}，失败 ${failed}`)
  console.log('='.repeat(50))

  if (failed > 0) {
    console.log('\n失败的测试：')
    testResults.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}`)
      console.log(`    ${t.error}`)
    })
    return false
  }
  return true
}

async function main() {
  let success = false
  try {
    console.log(`正在启动测试服务器 (端口 ${PORT})...`)
    await startServer()
    console.log('服务器启动成功，开始运行测试...')

    success = await runTests()
  } catch (e) {
    console.error('测试运行失败:', e.message)
    success = false
  } finally {
    stopServer()
    setTimeout(() => {
      process.exit(success ? 0 : 1)
    }, 500)
  }
}

main()
