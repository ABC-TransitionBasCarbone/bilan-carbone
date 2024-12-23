import { Command, Option } from 'commander'
import { getEmissionFactorsFromCSV } from '../../services/importEmissionFactor/legifrance/getEmissionFactors'

const program = new Command()

program
  .name('legifrance-import-emission')
  .description("Script pour importer les facteurs d'émission depuis la base Légifrance")
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Nom de la version')
  .requiredOption('-f, --file <value>', 'Import from CSV file')
  .addOption(
    new Option('-r, --reseau <value>', `Type de reseau ('chaud', 'froid')`)
      .choices(['chaud', 'froid'])
      .makeOptionMandatory(),
  )
  .parse(process.argv)

const params = program.opts()

getEmissionFactorsFromCSV(params.name, params.file, params.reseau)
