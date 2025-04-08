import { Command } from 'commander'
import { removeFormation } from '../../services/formations/formation'

const program = new Command()

program
  .name('delete-formation')
  .description("Script pour supprimer le lien d'une nouvelle formation")
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Nom de la formation')
  .parse(process.argv)

const params = program.opts()

removeFormation(params.name)
