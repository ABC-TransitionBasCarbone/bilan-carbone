import { Command } from 'commander'
import { addFormation } from '../../services/formations/formation'

const program = new Command()

program
  .name('add-formation')
  .description("Script pour importer le lien d'une nouvelle formation")
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Nom de la formation')
  .requiredOption('-l, --link <value>', 'Lien de la vidéo')
  .parse(process.argv)

const params = program.opts()

addFormation(params.name, params.link)
