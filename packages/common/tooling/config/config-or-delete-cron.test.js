const fs = require('fs')
const os = require('os')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')

const { shouldDeleteCron, writeCronConfig } = require('./config-or-delete-cron')

test('uses the repository cron.json by default', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-or-delete-cron-'))
  const scriptDir = path.join(tempDir, 'packages/common/tooling/config')
  const cronPath = path.join(tempDir, 'cron.json')
  const scriptPath = path.join(scriptDir, 'config-or-delete-cron.js')

  try {
    fs.mkdirSync(scriptDir, { recursive: true })
    fs.copyFileSync(path.join(__dirname, 'config-or-delete-cron.js'), scriptPath)
    fs.writeFileSync(cronPath, '{}', 'utf8')
    execFileSync(process.execPath, [scriptPath], { env: { ...process.env, APP_TARGET: 'bc' } })
    assert.equal(fs.existsSync(cronPath), true)
    execFileSync(process.execPath, [scriptPath], { env: { ...process.env, APP_TARGET: 'mip' } })
    assert.equal(fs.existsSync(cronPath), false)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

test('identifies mip target for cron deletion', () => {
  assert.equal(shouldDeleteCron('mip'), true)
  assert.equal(shouldDeleteCron('MIP'), true)
})

test('does not delete cron for non-mip targets', () => {
  assert.equal(shouldDeleteCron('bc'), false)
  assert.equal(shouldDeleteCron(undefined), false)
})

test('deletes cron.json for mip builds', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-or-delete-cron-'))
  const cronPath = path.join(tempDir, 'cron.json')

  fs.writeFileSync(cronPath, JSON.stringify({ jobs: [{ command: 'test' }] }), 'utf8')

  const config = writeCronConfig('mip', cronPath)

  assert.deepEqual(config, { deleted: true })
  assert.equal(fs.existsSync(cronPath), false)
})

test('keeps cron.json unchanged for non-mip builds', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-or-delete-cron-'))
  const cronPath = path.join(tempDir, 'cron.json')
  const originalConfig = { jobs: [{ command: 'test' }] }

  fs.writeFileSync(cronPath, JSON.stringify(originalConfig), 'utf8')

  const config = writeCronConfig('bc', cronPath)

  assert.deepEqual(config, { deleted: false })
  assert.deepEqual(JSON.parse(fs.readFileSync(cronPath, 'utf8')), originalConfig)
})
