import { Import } from '@abc-transitionbascarbone/db-common/enums'
import { Command } from 'commander'
import * as XLSX from 'xlsx'
import { applyOverridesFromRows } from '../../services/importEmissionFactor/applyOverrides'
import { parseSheetRows } from '../../services/importEmissionFactor/parseXlsx'

const program = new Command()

program
  .name('base-empreinte-apply-overrides')
  .description("Script pour appliquer des overrides manuels sur les facteurs d'émission de la base empreinte")
  .version('1.0.0')
  .requiredOption('-f, --file <value>', 'Fichier Excel (.xlsx) contenant les lignes à overrider')
  .requiredOption('-n, --name <value>', 'Nom de la version')
  .requiredOption('-b, --base <value>', 'Base depuis laquelle on importe les FEs')
  .option('--dry-run', 'Affiche un rapport sans écrire en base')
  .parse(process.argv)

const params = program.opts()

const workbook = XLSX.readFile(params.file)
const rows = parseSheetRows(workbook.Sheets[workbook.SheetNames[0]])

const baseParams = params.base
const baseImport = Import[baseParams as keyof typeof Import]
if (!baseImport || baseImport === Import.Manual) {
  throw Error("La base d'import n'est pas valide !")
}

applyOverridesFromRows(baseImport, params.name, rows, params.dryRun)
