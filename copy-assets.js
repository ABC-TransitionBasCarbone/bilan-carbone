const fs = require('fs').promises
const path = require('path')

function copyAssets(src, dest) {
  return fs
    .mkdir(dest, { recursive: true })
    .then(() => fs.readdir(src, { withFileTypes: true }))
    .then((items) => {
      const promises = items.map((item) => {
        const srcPath = path.join(src, item.name)
        const destPath = path.join(dest, item.name)

        if (item.isDirectory()) {
          return copyAssets(srcPath, destPath)
        }

        return fs.copyFile(srcPath, destPath)
      })

      return Promise.all(promises)
    })
}

function copyNextStandaloneAssets({ appDirectory, standaloneAppDirectory }) {
  const staticSrcPath = path.join(appDirectory, '.next/static')
  const staticDestPath = path.join(appDirectory, `.next/standalone/${standaloneAppDirectory}/.next/static`)

  const publicSrcPath = path.join(appDirectory, 'public')
  const publicDestPath = path.join(appDirectory, `.next/standalone/${standaloneAppDirectory}/public`)

  const i18nSrcPath = path.join(appDirectory, 'src', 'i18n', 'translations')
  const i18nDestPath = path.join(appDirectory, `.next/standalone/${standaloneAppDirectory}/src/i18n/translations`)

  return Promise.all([
    copyAssets(staticSrcPath, staticDestPath),
    copyAssets(publicSrcPath, publicDestPath),
    copyAssets(i18nSrcPath, i18nDestPath),
  ])
}

module.exports = {
  copyNextStandaloneAssets,
}

if (require.main === module) {
  const standaloneAppDirectory = process.argv[2]

  if (!standaloneAppDirectory) {
    console.error('Missing standalone app directory argument. Example: node copy-assets.js apps/mip')
    process.exit(1)
  }

  copyNextStandaloneAssets({
    appDirectory: process.cwd(),
    standaloneAppDirectory,
  })
    .then(() => console.log(`[OK] Assets copied successfully for ${standaloneAppDirectory}`))
    .catch((err) => {
      console.error(`[ERROR] Failed to copy assets for ${standaloneAppDirectory}: ${err}`)
      process.exit(1)
    })
}