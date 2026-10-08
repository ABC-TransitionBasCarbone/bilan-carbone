import { applyOverridesFromRows } from '@/services/importEmissionFactor/applyOverrides.server'
import { Import } from '@abc-transitionbascarbone/common/db/enums'
import { Command, Option } from 'commander'
import { parseEmissionFactorFile } from '../../services/importEmissionFactor/parseXlsx'

const program = new Command()

program
  .name('base-empreinte-apply-overrides')
  .description("Script pour appliquer des overrides manuels sur les facteurs d'émission d'une base")
  .version('1.0.0')
  .requiredOption('-f, --file <value>', 'Fichier Excel (.xlsx) ou CSV contenant les lignes à overrider')
  .addOption(
    new Option('-b, --base <value>', 'Base des facteurs d’émission à corriger')
      .choices(Object.values(Import).filter((source) => source !== Import.Manual))
      .default(Import.BaseEmpreinte),
  )
  .option('--dry-run', 'Affiche un rapport sans écrire en base')
  .parse(process.argv)

const params = program.opts<{ file: string; base: Import; dryRun?: boolean }>()

const rows = parseEmissionFactorFile(params.file)
applyOverridesFromRows(params.base, rows, params.dryRun)
