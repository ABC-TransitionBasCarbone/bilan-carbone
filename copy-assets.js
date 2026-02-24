const fs = require('fs').promises
const path = require('path')

const staticSrcPath = path.join(__dirname, '.next/static')
const staticDestPath = path.join(__dirname, '.next/standalone/.next/static')

const publicSrcPath = path.join(__dirname, 'public')
const publicDestPath = path.join(__dirname, '.next/standalone/public')

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

// Copy entire src/ and prisma/seed for one-off scripts run in the standalone container
const srcPath = path.join(__dirname, 'src')
const srcDestPath = path.join(__dirname, '.next/standalone/src')

const prismaSeedSrcPath = path.join(__dirname, 'prisma', 'seed')
const prismaSeedDestPath = path.join(__dirname, '.next/standalone/prisma/seed')

// Copy tsx so it's available for running scripts in the standalone container
const tsxSrcPath = path.join(__dirname, 'node_modules', 'tsx')
const tsxDestPath = path.join(__dirname, '.next/standalone/node_modules/tsx')

const tsconfigSrc = path.join(__dirname, 'tsconfig.json')
const tsconfigDest = path.join(__dirname, '.next/standalone/tsconfig.json')

Promise.all([
  copyAssets(staticSrcPath, staticDestPath),
  copyAssets(publicSrcPath, publicDestPath),
  copyAssets(srcPath, srcDestPath),
  copyAssets(prismaSeedSrcPath, prismaSeedDestPath),
  copyAssets(tsxSrcPath, tsxDestPath),
  fs.copyFile(tsconfigSrc, tsconfigDest),
])
  .then(() => console.log(`${greenTick} Assets copied successfully`))
  .catch((err) => console.error(`${redCross} Failed to copy assets: ${err}`))
