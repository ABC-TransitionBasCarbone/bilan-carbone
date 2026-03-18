import { Command } from 'commander'
import * as fs from 'fs'
import { stdin as input, stdout as output } from 'node:process'
import * as readline from 'node:readline/promises'
import { prismaClient } from '../../db/client'
import { importSectenData } from './secten'

const program = new Command()

program
  .name('import-secten')
  .description('Import Secten emissions data from CSV')
  .version('1.0.0')
  .requiredOption('-f, --file <value>', 'Path to CSV file')
  .requiredOption('-y, --year <value>', 'Publication year of the version (e.g. 2024)')
  .parse(process.argv)

const params = program.opts<{ name: string; file: string; year: string }>()

const main = async () => {
  if (!fs.existsSync(params.file)) {
    console.error('File not found:', params.file)
    process.exit(1)
  }

  const year = parseInt(params.year, 10)
  if (isNaN(year)) {
    console.error('Invalid year:', params.year)
    process.exit(1)
  }

  const existingVersion = await prismaClient.sectenVersion.findUnique({
    where: { year },
  })

  let shouldUpdate = false

  if (existingVersion) {
    const rl = readline.createInterface({ input, output })
    const answer = await rl.question(`Version "${existingVersion.year}" already exists. Update? (yes/no): `)
    rl.close()

    shouldUpdate = answer.toLowerCase() === 'yes'

    if (!shouldUpdate) {
      console.log('Import cancelled')
      process.exit(0)
    }
  }

  console.log('Importing Secten data...')
  const result = await importSectenData(year, params.file, shouldUpdate)

  if (result.success) {
    console.log(`✓ ${result.message} version ${result.versionId}`)

    const count = await prismaClient.sectenInfo.count({
      where: { versionId: result.versionId },
    })
    console.log(`Imported ${count} year records`)
  } else {
    console.error('Import failed:', result.message)
    process.exit(1)
  }
}

main()
