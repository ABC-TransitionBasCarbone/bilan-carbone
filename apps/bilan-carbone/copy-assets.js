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
        } else {
          return fs.copyFile(srcPath, destPath)
        }
      })
      return Promise.all(promises)
    })
    .catch((err) => {
      console.error(`Error: ${err}`)
      throw err
    })
}

const greenTick = `\x1b[32m\u2713\x1b[0m`
const redCross = `\x1b[31m\u274C\x1b[0m`

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
  copyNextStandaloneAssets({
    appDirectory: __dirname,
    standaloneAppDirectory: 'apps/bilan-carbone',
  })
    .then(() => console.log(`${greenTick} Assets copied successfully`))
    .catch((err) => console.error(`${redCross} Failed to copy assets: ${err}`))
}
