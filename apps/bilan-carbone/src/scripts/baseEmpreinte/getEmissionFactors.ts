import { Import } from '@abc-transitionbascarbone/db-common/enums'
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
  .option('--keep-overrides', 'Progagates existing manual overrides onto the new EF values')
  .option('--discard-overrides', 'Discards existing manual overrides and imports the new CSV values')
  .parse(process.argv)

const params = program.opts()

if (params.keepOverrides && params.discardOverrides) {
  console.error('Cannot use --keep-overrides and --discard-overrides at the same time')
  process.exit(1)
}

const overrideMode: OverrideMode | undefined = params.keepOverrides
  ? 'keep'
  : params.discardOverrides
    ? 'discard'
    : undefined

getEmissionFactorsFromCSV(params.name, params.file, Import.BaseEmpreinte, mapBaseEmpreinteEmissionFactors, {
  dryRun: params.dryRun,
  overrideMode,
})
