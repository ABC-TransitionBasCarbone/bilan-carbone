import { Command } from 'commander'
import { getEmissionFactorsFromCSV } from '../../services/import-fe/negaoctet/getEmissionFactors'

const program = new Command()

program
  .name('base-empreinte-import-emission')
  .description("Script pour importer les facteurs d'émission depuis la base negaoctet")
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Nom de la version')
  .requiredOption('-f, --file <value>', 'Import from CSV file')
  .parse(process.argv)

const params = program.opts()

getEmissionFactorsFromCSV(params.name, params.file)
