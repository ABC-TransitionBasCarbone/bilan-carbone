const { copyNextStandaloneAssets } = require('../bilan-carbone/copy-assets.js')

const greenTick = `\x1b[32m\u2713\x1b[0m`
const redCross = `\x1b[31m\u274C\x1b[0m`

copyNextStandaloneAssets({
  appDirectory: __dirname,
  standaloneAppDirectory: 'apps/mip',
})
  .then(() => console.log(`${greenTick} Assets copied successfully`))
  .catch((err) => console.error(`${redCross} Failed to copy assets: ${err}`))
