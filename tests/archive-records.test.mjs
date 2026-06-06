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

async function runTests() {
  console.log('\n样本归档记录功能测试')
  console.log('='.repeat(50))

  let sampleId1
  let sampleId2
  const uniqueSuffix = Date.now()

  console.log('\n1. 样本创建与状态变更测试')
  console.log('-'.repeat(30))

  await test('创建样本1（用于归档测试）', async () => {
    const res = await request('POST', '/samples', {
      code: `TEST-ARCH-${uniqueSuffix}-1`,
      name: '归档测试样本一号',
      type: '血液',
      source: '门诊',
    })
    assert(res.status === 201, `期望状态码 201，实际 ${res.status}`)
    assert(res.body.success === true, '响应 success 应为 true')
    sampleId1 = res.body.data.id
  })

  await test('创建样本2（用于搜索过滤测试）', async () => {
    const res = await request('POST', '/samples', {
      code: `TEST-ARCH-${uniqueSuffix}-2`,
      name: '普通测试样本二号',
      type: '尿液',
      source: '住院部',
    })
    assert(res.status === 201, `期望状态码 201，实际 ${res.status}`)
    assert(res.body.success === true, '响应 success 应为 true')
    sampleId2 = res.body.data.id
  })

  await test('将样本1状态更新为已归档 - 应成功', async () => {
    const res = await request('PUT', `/samples/${sampleId1}`, {
      status: '已归档',
      operator: '张三',
      note: '检测完成，结果正常，予以归档',
    })
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(res.body.success === true, '响应 success 应为 true')
    assert(res.body.data.status === '已归档', '状态应为已归档')
  })

  await test('状态变更时缺少操作人 - 应返回400', async () => {
    const res = await request('PUT', `/samples/${sampleId2}`, {
      status: '已完成',
    })
    assert(res.status === 400, `期望状态码 400，实际 ${res.status}`)
    assert(res.body.success === false, '响应 success 应为 false')
  })

  await test('相同状态不变化时不需要操作人', async () => {
    const res = await request('PUT', `/samples/${sampleId1}`, {
      status: '已归档',
    })
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(res.body.success === true, '响应 success 应为 true')
  })

  console.log('\n2. 归档列表接口测试')
  console.log('-'.repeat(30))

  await test('获取归档样本列表 - 应只包含已归档样本', async () => {
    const res = await request('GET', '/samples/archived')
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(res.body.success === true, '响应 success 应为 true')
    assert(Array.isArray(res.body.data), '应返回数组')
    const allArchived = res.body.data.every(s => s.status === '已归档')
    assert(allArchived, '所有返回样本状态都应为已归档')
    const hasSample1 = res.body.data.some(s => s.id === sampleId1)
    assert(hasSample1, '应包含样本1')
    const hasSample2 = res.body.data.some(s => s.id === sampleId2)
    assert(!hasSample2, '不应包含样本2（未归档）')
  })

  await test('归档样本应包含归档信息（时间、操作人、说明）', async () => {
    const res = await request('GET', '/samples/archived')
    const sample = res.body.data.find(s => s.id === sampleId1)
    assert(sample, '应找到归档样本')
    assert(sample.archived_at, '应有归档时间')
    assert(sample.archived_by === '张三', '归档人应为张三')
    assert(sample.archive_note === '检测完成，结果正常，予以归档', '归档说明应匹配')
  })

  await test('搜索归档样本 - 按编号搜索', async () => {
    const res = await request('GET', `/samples/archived?search=TEST-ARCH-${uniqueSuffix}-1`)
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(Array.isArray(res.body.data), '应返回数组')
    assert(res.body.data.length >= 1, '应至少找到一条结果')
    const allArchived = res.body.data.every(s => s.status === '已归档')
    assert(allArchived, '搜索结果中所有样本状态都应为已归档（验证Bug1修复）')
  })

  await test('搜索归档样本 - 按名称搜索', async () => {
    const res = await request('GET', '/samples/archived?search=归档测试样本一号')
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(Array.isArray(res.body.data), '应返回数组')
    assert(res.body.data.length >= 1, '应至少找到一条结果')
    const allArchived = res.body.data.every(s => s.status === '已归档')
    assert(allArchived, '搜索结果中所有样本状态都应为已归档（验证Bug1修复）')
  })

  await test('搜索归档样本 - 搜索非归档样本名称不应混入', async () => {
    const res = await request('GET', '/samples/archived?search=普通测试样本二号')
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(Array.isArray(res.body.data), '应返回数组')
    const hasSample2 = res.body.data.some(s => s.id === sampleId2)
    assert(!hasSample2, '搜索结果不应包含未归档的样本2（验证Bug1修复：非归档样本混入）')
  })

  console.log('\n3. 样本详情中的流转记录验证')
  console.log('-'.repeat(30))

  await test('样本详情应包含归档流转记录', async () => {
    const res = await request('GET', `/samples/${sampleId1}`)
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(res.body.data.transitions, '应包含流转记录')
    const archiveTransition = res.body.data.transitions.find(
      t => t.node_name === '已归档' && t.operator === '张三'
    )
    assert(archiveTransition, '应找到归档状态的流转记录（验证Bug2修复）')
    assert(archiveTransition.note === '检测完成，结果正常，予以归档', '流转记录备注应匹配')
  })

  await test('多次状态变更应创建多条流转记录', async () => {
    await request('PUT', `/samples/${sampleId2}`, {
      status: '实验中',
      operator: '李四',
      note: '开始实验',
    })
    await request('PUT', `/samples/${sampleId2}`, {
      status: '已完成',
      operator: '李四',
      note: '实验完成',
    })
    const res = await request('GET', `/samples/${sampleId2}`)
    const transitions = res.body.data.transitions.filter(
      t => t.node_name === '实验中' || t.node_name === '已完成'
    )
    assert(transitions.length >= 2, '应至少有两条状态变更流转记录')
  })

  console.log('\n4. 清理测试数据')
  console.log('-'.repeat(30))

  await test('删除测试样本1', async () => {
    const res = await request('DELETE', `/samples/${sampleId1}`)
    assert(res.status === 200, '删除应成功')
  })

  await test('删除测试样本2', async () => {
    const res = await request('DELETE', `/samples/${sampleId2}`)
    assert(res.status === 200, '删除应成功')
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
