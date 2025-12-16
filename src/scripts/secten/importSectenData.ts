import { Command } from 'commander'
import * as fs from 'fs'
import { stdin as input, stdout as output } from 'node:process'
import * as readline from 'node:readline/promises'
import { prismaClient } from '../../db/client'
import { importSectenData } from '../../services/secten/secten'

const program = new Command()

program
  .name('import-secten')
  .description('Import Secten emissions data from CSV')
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Version name')
  .requiredOption('-f, --file <value>', 'Path to CSV file')
  .parse(process.argv)

const params = program.opts<{ name: string; file: string }>()

const main = async () => {
  if (!fs.existsSync(params.file)) {
    console.error('File not found:', params.file)
    process.exit(1)
  }

  const existingVersion = await prismaClient.sectenVersion.findUnique({
    where: { name: params.name },
  })

  let shouldUpdate = false

  if (existingVersion) {
    const rl = readline.createInterface({ input, output })
    const answer = await rl.question(`Version "${existingVersion.name}" already exists. Update? (yes/no): `)
    rl.close()

    shouldUpdate = answer.toLowerCase() === 'yes'

    if (!shouldUpdate) {
      console.log('Import cancelled')
      process.exit(0)
    }
  }

  console.log('Importing Secten data...')
  const result = await importSectenData(params.name, params.file, shouldUpdate)

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
