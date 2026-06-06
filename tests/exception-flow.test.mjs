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
  console.log('\n异常登记数据流链路测试')
  console.log('='.repeat(50))

  let sampleId
  let exceptionId

  console.log('\n1. 样本创建测试')
  console.log('-'.repeat(30))

  await test('创建样本成功', async () => {
    const res = await request('POST', '/samples', {
      code: `TEST-EXC-${Date.now()}`,
      name: '异常测试样本',
      type: '血液',
      source: '门诊',
    })
    assert(res.status === 201, `期望状态码 201，实际 ${res.status}`)
    assert(res.body.success === true, '响应 success 应为 true')
    assert(res.body.data.id, '应返回样本 ID')
    sampleId = res.body.data.id
  })

  console.log('\n2. 异常登记 CRUD 测试')
  console.log('-'.repeat(30))

  await test('创建异常记录 - 成功', async () => {
    const res = await request('POST', '/exceptions', {
      sample_id: sampleId,
      type: '污染',
      title: '样本容器有污染迹象',
      description: '样本管外壁有不明液体，可能造成交叉污染',
      reporter: '张三',
    })
    assert(res.status === 201, `期望状态码 201，实际 ${res.status}`)
    assert(res.body.success === true, '响应 success 应为 true')
    assert(res.body.data.id, '应返回异常记录 ID')
    assert(res.body.data.type === '污染', '异常类型应为污染')
    assert(res.body.data.status === '待处理', '初始状态应为待处理')
    assert(res.body.data.sample_id === sampleId, '应关联正确的样本')
    assert(res.body.data.sample_code, '应包含样本编号')
    assert(res.body.data.sample_name, '应包含样本名称')
    assert(res.body.data.reporter === '张三', '报告人应为张三')
    assert(res.body.data.created_at, '应有创建时间')
    exceptionId = res.body.data.id
  })

  await test('创建异常记录 - 缺失必填字段', async () => {
    const res = await request('POST', '/exceptions', {
      sample_id: sampleId,
      title: '缺少类型和报告人',
    })
    assert(res.status === 400, `期望状态码 400，实际 ${res.status}`)
    assert(res.body.success === false, '响应 success 应为 false')
  })

  await test('创建异常记录 - 样本不存在', async () => {
    const res = await request('POST', '/exceptions', {
      sample_id: 99999,
      type: '污染',
      title: '测试不存在样本',
      reporter: '张三',
    })
    assert(res.status === 400, `期望状态码 400，实际 ${res.status}`)
    assert(res.body.success === false, '响应 success 应为 false')
  })

  await test('创建异常记录 - 无效异常类型', async () => {
    const res = await request('POST', '/exceptions', {
      sample_id: sampleId,
      type: '无效类型',
      title: '测试无效类型',
      reporter: '张三',
    })
    assert(res.status === 400, `期望状态码 400，实际 ${res.status}`)
    assert(res.body.success === false, '响应 success 应为 false')
  })

  await test('获取异常列表 - 按样本ID筛选', async () => {
    const res = await request('GET', `/exceptions?sample_id=${sampleId}`)
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(res.body.success === true, '响应 success 应为 true')
    assert(Array.isArray(res.body.data), '应返回数组')
    assert(res.body.data.length >= 1, '至少应有一条异常记录')
    res.body.data.forEach(item => {
      assert(item.sample_id === sampleId, '所有返回项应关联正确样本')
      assert(item.sample_code, '应包含样本编号')
      assert(item.sample_name, '应包含样本名称')
    })
  })

  await test('获取异常列表 - 按类型筛选', async () => {
    const res = await request('GET', '/exceptions?type=污染')
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(res.body.success === true, '响应 success 应为 true')
    assert(Array.isArray(res.body.data), '应返回数组')
    res.body.data.forEach(item => {
      assert(item.type === '污染', '所有返回项类型应为污染')
    })
  })

  await test('获取异常列表 - 按状态筛选', async () => {
    const res = await request('GET', '/exceptions?status=待处理')
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(res.body.success === true, '响应 success 应为 true')
    assert(Array.isArray(res.body.data), '应返回数组')
    res.body.data.forEach(item => {
      assert(item.status === '待处理', '所有返回项状态应为待处理')
    })
  })

  await test('获取异常详情 - 成功', async () => {
    const res = await request('GET', `/exceptions/${exceptionId}`)
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(res.body.success === true, '响应 success 应为 true')
    assert(res.body.data.id === exceptionId, 'ID 应匹配')
    assert(res.body.data.type === '污染', '类型应匹配')
    assert(res.body.data.title === '样本容器有污染迹象', '标题应匹配')
    assert(res.body.data.sample_code, '应包含样本编号')
    assert(res.body.data.sample_name, '应包含样本名称')
  })

  await test('获取异常详情 - 不存在的ID', async () => {
    const res = await request('GET', '/exceptions/99999')
    assert(res.status === 404, `期望状态码 404，实际 ${res.status}`)
    assert(res.body.success === false, '响应 success 应为 false')
  })

  await test('更新异常 - 状态流转到处理中', async () => {
    const res = await request('PUT', `/exceptions/${exceptionId}`, {
      status: '处理中',
      handler: '李四',
    })
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(res.body.success === true, '响应 success 应为 true')
    assert(res.body.data.status === '处理中', '状态应为处理中')
    assert(res.body.data.handler === '李四', '处理人应为李四')
    assert(res.body.data.updated_at, '应有更新时间')
  })

  await test('更新异常 - 解决异常并填写解决方案', async () => {
    const res = await request('PUT', `/exceptions/${exceptionId}`, {
      status: '已解决',
      resolution: '已重新取样，原样本已废弃处理',
    })
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(res.body.success === true, '响应 success 应为 true')
    assert(res.body.data.status === '已解决', '状态应为已解决')
    assert(res.body.data.resolved_at, '应有解决时间')
    assert(res.body.data.resolution === '已重新取样，原样本已废弃处理', '解决方案应匹配')
  })

  await test('更新异常 - 重新打开后 resolved_at 应清空', async () => {
    const res = await request('PUT', `/exceptions/${exceptionId}`, {
      status: '处理中',
    })
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(res.body.data.status === '处理中', '状态应为处理中')
    assert(res.body.data.resolved_at === null, '解决时间应清空')
  })

  await test('更新异常 - 无效状态值', async () => {
    const res = await request('PUT', `/exceptions/${exceptionId}`, {
      status: '无效状态',
    })
    assert(res.status === 400, `期望状态码 400，实际 ${res.status}`)
    assert(res.body.success === false, '响应 success 应为 false')
  })

  await test('更新异常 - 不存在的ID', async () => {
    const res = await request('PUT', '/exceptions/99999', {
      status: '处理中',
    })
    assert(res.status === 404, `期望状态码 404，实际 ${res.status}`)
    assert(res.body.success === false, '响应 success 应为 false')
  })

  await test('删除异常记录 - 成功', async () => {
    const res = await request('DELETE', `/exceptions/${exceptionId}`)
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(res.body.success === true, '响应 success 应为 true')
  })

  await test('删除后验证异常已不存在', async () => {
    const res = await request('GET', `/exceptions/${exceptionId}`)
    assert(res.status === 404, `期望状态码 404，实际 ${res.status}`)
  })

  await test('删除异常记录 - 不存在的ID', async () => {
    const res = await request('DELETE', '/exceptions/99999')
    assert(res.status === 404, `期望状态码 404，实际 ${res.status}`)
    assert(res.body.success === false, '响应 success 应为 false')
  })

  console.log('\n3. 级联删除测试')
  console.log('-'.repeat(30))

  let cascadeExceptionId

  await test('创建用于级联测试的异常记录', async () => {
    const res = await request('POST', '/exceptions', {
      sample_id: sampleId,
      type: '破损',
      title: '样本管破损测试',
      description: '运输过程中样本管破裂',
      reporter: '王五',
    })
    assert(res.status === 201, `期望状态码 201，实际 ${res.status}`)
    cascadeExceptionId = res.body.data.id
  })

  await test('删除样本后异常记录应级联删除', async () => {
    const delRes = await request('DELETE', `/samples/${sampleId}`)
    assert(delRes.status === 200, '样本删除应成功')

    const excRes = await request('GET', `/exceptions/${cascadeExceptionId}`)
    assert(excRes.status === 404, '异常记录应随样本级联删除')
  })

  console.log('\n4. 多异常场景测试')
  console.log('-'.repeat(30))

  let multiSampleId

  await test('创建多异常测试样本', async () => {
    const res = await request('POST', '/samples', {
      code: `TEST-MULTI-${Date.now()}`,
      name: '多异常测试样本',
      type: '唾液',
      source: '住院部',
    })
    assert(res.status === 201, `期望状态码 201，实际 ${res.status}`)
    multiSampleId = res.body.data.id
  })

  await test('为同一样本创建多条异常记录', async () => {
    const types = ['污染', '破损', '信息缺失']
    for (let i = 0; i < types.length; i++) {
      const res = await request('POST', '/exceptions', {
        sample_id: multiSampleId,
        type: types[i],
        title: `异常记录 ${i + 1}`,
        description: `第 ${i + 1} 条异常描述`,
        reporter: '测试员',
      })
      assert(res.status === 201, `第 ${i + 1} 条异常创建应成功`)
    }
  })

  await test('同一样本应返回全部异常记录', async () => {
    const res = await request('GET', `/exceptions?sample_id=${multiSampleId}`)
    assert(res.status === 200, `期望状态码 200，实际 ${res.status}`)
    assert(res.body.data.length === 3, `应返回 3 条异常，实际 ${res.body.data.length}`)
  })

  await test('清理 - 删除测试样本', async () => {
    const res = await request('DELETE', `/samples/${multiSampleId}`)
    assert(res.status === 200, '样本删除应成功')
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
    // 给进程一点时间清理
    setTimeout(() => {
      process.exit(success ? 0 : 1)
    }, 500)
  }
}

main()
