import { Command } from 'commander'
import { getEmissionFactorsFromCSV } from '../../services/import-fe/legifrance/getEmissionFactors'

const program = new Command()

program
  .name('base-empreinte-import-emission')
  .description("Script pour importer les facteurs d'émission depuis la base LégiFrance")
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Nom de la version')
  .requiredOption('-f, --file <value>', 'Import from CSV file')
  .requiredOption('-r, --reseau <value>', `Type de reseau ('froid', 'chaud')`, (value) => {
    if (!['froid', 'chaud'].includes(value)) {
      throw new Error(`reseau doit être 'froid' ou 'chaud'`)
    }
    return value
  })
  .parse(process.argv)

const params = program.opts()

getEmissionFactorsFromCSV(params.name, params.file, params.reseau)
