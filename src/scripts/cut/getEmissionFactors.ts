import { Command } from 'commander'
import { getEmissionFactorsFromCSV } from '../../services/importEmissionFactor/cut/getEmissionFactors'

const program = new Command()

program
  .name('cut-import-emission')
  .description("Script pour importer les facteurs d'émission depuis la base CUT")
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Nom de la version')
  .requiredOption('-f, --file <value>', 'Import from CSV file')
  .parse(process.argv)

const params = program.opts()

getEmissionFactorsFromCSV(params.name, params.file)
