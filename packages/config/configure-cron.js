const fs = require('fs')
const path = require('path')

const activeJobs = [
  {
    command:
      '*/10 * * * * curl --silent --show-error --fail --output /dev/null -X POST $NEXT_API_URL/cron/import-users -H "Authorization: Bearer $CRON_SECRET"',
    description: 'Import users from FTP server every 10 minutes',
  },
  {
    command:
      '0 1 * * * curl --silent --show-error --fail --output /dev/null -X POST $NEXT_API_URL/cron/assign-training-studies -H "Authorization: Bearer $CRON_SECRET"',
    description: 'Create training studies for users who started or ended a formation',
  },
]

function getCronConfig(appTarget) {
  const normalizedTarget = typeof appTarget === 'string' ? appTarget.trim().toLowerCase() : ''

  if (normalizedTarget === 'mip') {
    return null
  }

  return { jobs: activeJobs }
}

function writeCronConfig(appTarget = process.env.APP_TARGET, cronPath = path.resolve(__dirname, '../../cron.json')) {
  const config = getCronConfig(appTarget)

  if (!config) {
    if (fs.existsSync(cronPath)) {
      fs.unlinkSync(cronPath)
    }

    return null
  }

  fs.writeFileSync(cronPath, JSON.stringify(config, null, 2) + '\n', 'utf8')

  return config
}

if (require.main === module) {
  writeCronConfig()
}

module.exports = {
  activeJobs,
  getCronConfig,
  writeCronConfig,
}
