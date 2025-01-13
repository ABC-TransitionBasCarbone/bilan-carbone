import { Command } from 'commander'
import { getEmissionFactorsFromAPI } from '../../services/importEmissionFactor/baseEmpreinte/getEmissionFactorsFromAPI'
import { getEmissionFactorsFromCSV } from '../../services/importEmissionFactor/baseEmpreinte/getEmissionFactorsFromCSV'

const program = new Command()

program
  .name('base-empreinte-import-emission')
  .description("Script pour importer les facteurs d'émission depuis la base empreinte")
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Nom de la version')
  .option('-f, --file <value>', 'Import from CSV file')
  .parse(process.argv)

const params = program.opts()

if (params.file) {
  getEmissionFactorsFromCSV(params.name, params.file)
} else {
  getEmissionFactorsFromAPI(params.name)
}
