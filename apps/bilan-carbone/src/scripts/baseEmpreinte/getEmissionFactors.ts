import { Import } from '@repo/db-common/enums'
import { Command } from 'commander'
import { mapBaseEmpreinteEmissionFactors } from '../../services/importEmissionFactor/baseEmpreinte/import'
import { getEmissionFactorsFromCSV, OverrideMode } from '../../services/importEmissionFactor/getEmissionFactorsFromCSV'

const program = new Command()

program
  .name('base-empreinte-import-emission')
  .description("Script pour importer les facteurs d'émission depuis la base empreinte")
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Nom de la version')
  .requiredOption('-f, --file <value>', 'Import depuis un fichier CSV complet')
  .option('--dry-run', 'Affiche un rapport sans écrire en base')
  .option('--keep-overrides', 'En cas de conflits, duplique les overrides existants vers les nouveaux EFs')
  .option(
    '--discard-overrides',
    "En cas de conflits, ignore les overrides existants (les nouveaux EFs n'ont pas d'override)",
  )
  .parse(process.argv)

const params = program.opts()

if (params.keepOverrides && params.discardOverrides) {
  console.error('Cannot use --keep-overrides and --discard-overrides together')
  process.exit(1)
}

const overrideMode: OverrideMode = params.keepOverrides ? 'keep' : params.discardOverrides ? 'discard' : 'none'

getEmissionFactorsFromCSV(params.name, params.file, Import.BaseEmpreinte, mapBaseEmpreinteEmissionFactors, {
  dryRun: params.dryRun,
  overrideMode,
})
