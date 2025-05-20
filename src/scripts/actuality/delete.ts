import { deleteActuality } from '@/db/actuality'
import { Command } from 'commander'

const program = new Command()

program
  .name('delete-actuality')
  .description('Script pour supprimer une actualité')
  .version('1.0.0')
  .requiredOption("-a, --actuality <value>', 'Id de l'actualité à supprimer")
  .parse(process.argv)

const params = program.opts()

deleteActuality(params.actuality)
console.log('Actualité supprimée')
