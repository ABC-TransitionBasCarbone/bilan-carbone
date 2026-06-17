const fs = require('fs').promises
const path = require('path')

const appPathArg = process.argv[2] || 'apps/bilan-carbone'
const appPath = path.resolve(__dirname, appPathArg)

const staticSrcPath = path.join(appPath, '.next/static')
const staticDestPath = path.join(appPath, '.next/standalone', appPathArg, '.next/static')

const publicSrcPath = path.join(appPath, 'public')
const publicDestPath = path.join(appPath, '.next/standalone', appPathArg, 'public')

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

const redCross = `\x1b[31m\u274C\x1b[0m`
const greenTick = `\x1b[32m\u2713\x1b[0m`

// Also copy i18n translation files for production i18n support
const i18nSrcPath = path.join(appPath, 'src', 'i18n', 'translations')
const i18nDestPath = path.join(appPath, '.next/standalone', appPathArg, 'src/i18n/translations')

async function main() {
  const copyPromises = [copyAssets(staticSrcPath, staticDestPath), copyAssets(publicSrcPath, publicDestPath)]

  try {
    await fs.access(i18nSrcPath)
    copyPromises.push(copyAssets(i18nSrcPath, i18nDestPath))
  } catch {
    // Some apps do not expose i18n translations from src/i18n/translations.
  }

  await Promise.all(copyPromises)
  console.log(`${greenTick} Assets copied successfully for ${appPathArg}`)
}

main().catch((err) => {
  console.error(`${redCross} Failed to copy assets for ${appPathArg}: ${err}`)
  process.exit(1)
})
