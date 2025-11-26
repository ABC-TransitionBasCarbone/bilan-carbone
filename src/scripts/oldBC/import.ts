import { Command } from 'commander'
import { uploadOldBCInformations } from './transition/oldBC'

const program = new Command()

program
  .name('import-old-bc')
  .description("Script pour importer les organisations et les facteurs d'émission depuis l'ancien BC+")
  .version('1.0.0')
  .requiredOption('-f, --file <value>', 'Import from XLSX file')
  .requiredOption('-e, --email <value>', 'User email')
  .requiredOption('-o, --organization-version <value>', 'User organization version ID')
  .option('-s, --skip', 'do not import, only validate the file')
  .parse(process.argv)

const params = program.opts()

uploadOldBCInformations(params.file, params.email.toLowerCase(), params.organizationVersion, params.skip)
