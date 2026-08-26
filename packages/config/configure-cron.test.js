const fs = require('fs')
const os = require('os')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert/strict')

const { activeJobs, getCronConfig, writeCronConfig } = require('./configure-cron')

test('returns no cron jobs for mip builds', () => {
  assert.deepEqual(getCronConfig('mip'), { jobs: [] })
  assert.deepEqual(getCronConfig('MIP'), { jobs: [] })
})

test('returns active cron jobs for non-mip builds', () => {
  assert.deepEqual(getCronConfig('bilan-carbone'), { jobs: activeJobs })
  assert.deepEqual(getCronConfig(undefined), { jobs: activeJobs })
})

test('writes the selected cron configuration to disk', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'configure-cron-'))
  const cronPath = path.join(tempDir, 'cron.json')

  writeCronConfig('mip', cronPath)

  assert.deepEqual(JSON.parse(fs.readFileSync(cronPath, 'utf8')), { jobs: [] })
})
