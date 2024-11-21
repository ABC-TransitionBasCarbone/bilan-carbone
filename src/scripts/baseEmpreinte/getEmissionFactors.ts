import { Command } from 'commander'
import getEmissionFactors from '../../services/baseEmpreinte/getEmissionFactors'

const program = new Command()

program
  .name('base-empreinte-import-emission')
  .description("Script pour importer les facteurs d'émission depuis la base empreinte")
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Nom de la version')
  .parse(process.argv)

getEmissionFactors(program.opts())
