import { Command } from 'commander'
import { stdin as input, stdout as output } from 'node:process'
import * as readline from 'node:readline/promises'
import { uploadOldBCInformations } from './transition/oldBC'

const program = new Command()

program
  .name('import-old-bc')
  .description("Script pour importer les organisations et les facteurs d'émission depuis l'ancien BC+")
  .version('1.0.0')
  .requiredOption('-f, --file <value>', 'Import from XLSX file')
  .requiredOption('-e, --email <value>', 'User email')
  .requiredOption('-o, --organization-version <value>', 'User organization version ID')
  .option('-s, --skip', 'do not import, only validate the file')
  .parse(process.argv)

const params = program.opts()

const launchingProgram = async () => {
  const getUserConfirmation = async () => {
    const rl = readline.createInterface({ input, output })
    const doWeContinue = await rl.question(
      "Tu n'as pas choisi de passer en mode vérification (pas de paramètre skip), es-tu sûr de vouloir continuer ? (oui/non) ",
    )

    const userConfirmation = doWeContinue?.toLocaleLowerCase() === 'oui'
    rl.close()
    return userConfirmation
  }

  const launch = !params.skip ? await getUserConfirmation() : true

  if (!launch) {
    console.log('On arrête le programme')
  } else {
    if (params.skip) {
      console.log('trying the migration wihout importing, just to validate the file')
    } else {
      console.log("C'est parti pour la migration !")
    }
    await uploadOldBCInformations(params.file, params.email.toLowerCase(), params.organizationVersion, params.skip)
  }
}

launchingProgram()
