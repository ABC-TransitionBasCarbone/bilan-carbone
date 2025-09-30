import { setKeyStudy } from '@/services/serverFunctions/study'
import { DuplicableStudy, Environment } from '@prisma/client'
import { Command } from 'commander'

const program = new Command()

program
  .name('set-key-study')
  .description('Script pour paramétrer les études clés pour un environnement donné')
  .version('1.0.0')
  .requiredOption('-k, --key <value>', 'Nom de la clé')
  .requiredOption('-e, --env <value>', "Nom de l'environnement")
  .requiredOption('-v, --value <value>', "Id de l'étude concernée")
  .parse(process.argv)

const params = program.opts()

const setStudyKey = async () => {
  if (!Object.values(DuplicableStudy).includes(params.key)) {
    console.log(`Clé non valide. Liste des valeurs possible : `, Object.values(DuplicableStudy).join(', '))
    return
  }
  if (!Object.values(Environment).includes(params.env)) {
    console.log(`Environnement non valide. Liste des valeurs possible : `, Object.values(Environment).join(', '))
    return
  }
  const res = await setKeyStudy(params.key as DuplicableStudy, params.env as Environment, params.value)
  console.log(res)
}

setStudyKey()
