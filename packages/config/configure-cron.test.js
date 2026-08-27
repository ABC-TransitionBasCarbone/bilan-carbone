const fs = require('fs')
const os = require('os')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { activeJobs, getCronConfig, writeCronConfig } = require('./configure-cron')

test('returns no cron jobs for mip builds', () => {
  assert.equal(getCronConfig('mip'), null)
  assert.equal(getCronConfig('MIP'), null)
})

test('returns active cron jobs for non-mip builds', () => {
  assert.deepEqual(getCronConfig('bilan-carbone'), { jobs: activeJobs })
  assert.deepEqual(getCronConfig(undefined), { jobs: activeJobs })
})

test('deletes cron.json for mip builds', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'configure-cron-'))
  const cronPath = path.join(tempDir, 'cron.json')

  fs.writeFileSync(cronPath, JSON.stringify({ jobs: activeJobs }), 'utf8')

  const config = writeCronConfig('mip', cronPath)

  assert.equal(config, null)
  assert.equal(fs.existsSync(cronPath), false)
})

test('writes cron.json for non-mip builds', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'configure-cron-'))
  const cronPath = path.join(tempDir, 'cron.json')

  writeCronConfig('bilan-carbone', cronPath)

  assert.deepEqual(JSON.parse(fs.readFileSync(cronPath, 'utf8')), { jobs: activeJobs })
})
