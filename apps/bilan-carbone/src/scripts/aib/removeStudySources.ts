import { removeSourceToAllStudies } from '@/db/study'
import { Import } from '@abc-transitionbascarbone/db-common/enums'
import { Command } from 'commander'

const program = new Command()

program
  .name('delete-study-sources')
  .description('Script pour supprimer une source AIB des études')
  .version('1.0.0')
  .parse(process.argv)

removeSourceToAllStudies(Import.AIB)

console.log("Sources d'étude supprimées pour la source AIB n'ayant pas d'export GHG-P")
