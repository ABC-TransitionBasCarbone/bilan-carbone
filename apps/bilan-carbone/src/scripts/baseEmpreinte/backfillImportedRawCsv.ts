import { Import } from '@abc-transitionbascarbone/db-common/enums'
import { Command } from 'commander'
import { prismaClient } from '../../db/client.server'
import { parseCSVRows } from '../../services/importEmissionFactor/getEmissionFactorsFromCSV'
import { getType, serializeRowAsCsv } from '../../services/importEmissionFactor/import'

const program = new Command()

program
  .name('base-empreinte-backfill-imported-raw-csv')
  .description(
    "Backfill importedRawCsv on existing EFs and parts that were imported before the field was introduced. Reads the original CSV and writes the raw CSV line on matching rows that don't have it yet.",
  )
  .version('1.0.0')
  .requiredOption('-n, --name <value>', 'Nom de la version à remplir (ex: 23.4)')
  .requiredOption('-f, --file <value>', 'Fichier CSV original utilisé pour cet import')
  .option('--dry-run', 'Affiche un rapport sans écrire en base')
  .parse(process.argv)

const params = program.opts()

const run = async () => {
  const importVersion = await prismaClient.emissionFactorImportVersion.findFirst({
    where: { name: params.name, source: Import.BaseEmpreinte },
  })
  if (!importVersion) {
    console.error(`No import version found with name "${params.name}" for BaseEmpreinte`)
    process.exit(1)
  }

  console.log(`Parsing CSV...`)
  const { emissionFactors, parts } = await parseCSVRows(params.file)
  console.log(`${emissionFactors.length} EF rows + ${parts.length} part rows parsed`)

  const importedIds = emissionFactors.map((ef) => ef["Identifiant_de_l'élément"])

  const existingEFs = await prismaClient.emissionFactor.findMany({
    where: {
      importedId: { in: importedIds },
      importedFrom: Import.BaseEmpreinte,
      versions: { some: { importVersionId: importVersion.id } },
      importedRawCsv: null,
    },
    select: {
      id: true,
      importedId: true,
      emissionFactorParts: { select: { id: true, type: true, importedRawCsv: true } },
    },
  })

  const existingByImportedId = new Map(existingEFs.map((ef) => [ef.importedId!, ef]))

  const efsToBackfill = existingEFs.length
  const partsToBackfill = existingEFs.flatMap((ef) =>
    ef.emissionFactorParts.filter((p) => p.importedRawCsv === null),
  ).length

  if (efsToBackfill === 0 && partsToBackfill === 0) {
    console.log(`All EFs and parts for version "${params.name}" already have importedRawCsv — nothing to backfill`)
    return
  }

  console.log(`${efsToBackfill} EFs to backfill, ${partsToBackfill} parts to backfill`)

  if (params.dryRun) {
    console.log('Dry run — no writes')
    return
  }

  let updatedEFs = 0
  for (const row of emissionFactors) {
    const ef = existingByImportedId.get(row["Identifiant_de_l'élément"])
    if (!ef) {
      continue
    }
    await prismaClient.emissionFactor.update({
      where: { id: ef.id },
      data: { importedRawCsv: serializeRowAsCsv(row) },
    })
    updatedEFs++
    if (updatedEFs % 500 === 0) {
      console.log(`EFs: ${updatedEFs}/${efsToBackfill}...`)
    }
  }

  let updatedParts = 0
  for (const partRow of parts) {
    const ef = existingByImportedId.get(partRow["Identifiant_de_l'élément"])
    if (!ef) {
      continue
    }
    const partType = getType(partRow.Type_poste)
    const existingPart = ef.emissionFactorParts.find((p) => p.type === partType && p.importedRawCsv === null)
    if (!existingPart) {
      continue
    }
    await prismaClient.emissionFactorPart.update({
      where: { id: existingPart.id },
      data: { importedRawCsv: serializeRowAsCsv(partRow) },
    })
    updatedParts++
    if (updatedParts % 500 === 0) {
      console.log(`Parts: ${updatedParts}/${partsToBackfill}...`)
    }
  }

  console.log(`Done — backfilled ${updatedEFs} EFs and ${updatedParts} parts`)
}

run()
