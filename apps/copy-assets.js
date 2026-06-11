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

function copyAppAssets(appName, appDir) {
  const staticSrcPath = path.join(appDir, '.next/static')
  const staticDestPath = path.join(appDir, `.next/standalone/apps/${appName}/.next/static`)

  const publicSrcPath = path.join(appDir, 'public')
  const publicDestPath = path.join(appDir, `.next/standalone/apps/${appName}/public`)

  const i18nSrcPath = path.join(appDir, 'src', 'i18n', 'translations')
  const i18nDestPath = path.join(appDir, `.next/standalone/apps/${appName}/src/i18n/translations`)

  const greenTick = `\x1b[32m\u2713\x1b[0m`
  const redCross = `\x1b[31m\u274C\x1b[0m`

  return Promise.all([
    copyAssets(staticSrcPath, staticDestPath),
    copyAssets(publicSrcPath, publicDestPath),
    copyAssets(i18nSrcPath, i18nDestPath),
  ])
    .then(() => console.log(`${greenTick} Assets copied successfully`))
    .catch((err) => console.error(`${redCross} Failed to copy assets: ${err}`))
}

module.exports = { copyAppAssets }
