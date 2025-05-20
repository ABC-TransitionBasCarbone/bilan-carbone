import { deleteFormation } from '@/db/formation'
import { Command } from 'commander'

const program = new Command()

program
  .name('delete-formation')
  .description("Script pour supprimer le lien d'une nouvelle formation")
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Nom de la formation')
  .parse(process.argv)

const params = program.opts()

const removeFormation = async (name: string) => {
  const result = await deleteFormation(name)
  console.log('Formation supprimée : ', result.name)
}

removeFormation(params.name)
