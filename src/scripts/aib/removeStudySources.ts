// Description du bug

// On a ajouté la source AIB à toutes les études lors de l'import de la source d'émission alors qu'il n'aurait pas fallu car c'est une source un peu particuliere qu'on ne veut voir apparaitre que si le GHGP est selectionné.

// A faire :

// Un script pour supprimer la source de toute les études sauf celles ayant activé le GHGP. Il faut également du coup supprimer les Fes AIB des sources d'émissions
// Vérifier en bdd combien de personnes sont concernés au moment du lancement du script. A decider avant : que fait-on poru ces personnes ? Leur envoie-t-on un mail pour les prévenir ?

import { removeSourceToAllStudies } from '@/db/study'
import { addMissingSourceToStudies } from '@/services/serverFunctions/study'
import { Import } from '@prisma/client'
import { Command } from 'commander'

const program = new Command()

program
  .name('delete-study-sources')
  .description('Script pour supprimer une source AIB des études')
  .version('1.0.0')
  .requiredOption('-d, --date <value>', 'Date avant laquelle les sources doivent être supprimées (format YYYY-MM-DD)')
  .parse(process.argv)

const params = program.opts()

removeSourceToAllStudies(Import.AIB, new Date(params.date)).then((removed) => {
  addMissingSourceToStudies(Import.AIB)
  console.log(`${removed} sources d'étude AIB supprimées des études n'ayant pas activé le GHGP`)
})
// npx tsx src/scripts/aib/removeStudySources.ts -d 2026-09-02
// dévalider les sources d'étude AIB des études n'ayant pas activé le GHGP
// ajouter la source d'étude AIB aux études ayant activé le GHGP mais ne l'ayant pas encore
//
console.log("Sources d'étude supprimées pour la source AIB")
