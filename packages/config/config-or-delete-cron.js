const fs = require('fs')
const path = require('path')

const shouldDeleteCron = (appTarget) => {
  const normalizedTarget = typeof appTarget === 'string' ? appTarget.trim().toLowerCase() : ''

  return normalizedTarget === 'mip'
}

const writeCronConfig = (appTarget = process.env.APP_TARGET, cronPath = path.resolve(__dirname, '../../cron.json')) => {
  if (shouldDeleteCron(appTarget)) {
    if (fs.existsSync(cronPath)) {
      fs.unlinkSync(cronPath)
    }

    return { deleted: true }
  }

  return { deleted: false }
}

if (require.main === module) {
  writeCronConfig()
}

module.exports = {
  shouldDeleteCron,
  writeCronConfig,
}
