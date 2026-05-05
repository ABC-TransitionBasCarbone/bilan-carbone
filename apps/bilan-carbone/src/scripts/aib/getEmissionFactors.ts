import { addMissingSourceToStudies } from '@/services/serverFunctions/study'
import { Import } from '@abc-transitionbascarbone/db-common/enums'
import { Command } from 'commander'
import { getEmissionFactorsFromCSV } from '../../services/importEmissionFactor/aib/getEmissionFactors'

const program = new Command()

program
  .name('aib-import-emission')
  .description("Script pour importer les facteurs d'émission depuis la base market based AIB")
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Nom de la version')
  .requiredOption('-f, --file <value>', 'Import from CSV file')
  .parse(process.argv)

const params = program.opts()

getEmissionFactorsFromCSV(params.name, params.file).then(() => {
  addMissingSourceToStudies(Import.AIB)
})
