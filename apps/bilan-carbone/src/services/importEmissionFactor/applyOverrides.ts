import { Import } from '@abc-transitionbascarbone/db-common/enums'
import { MIN, TIME_IN_MS } from '@abc-transitionbascarbone/utils'
import { prismaClient } from '../../db/client.server'
import { getEmissionFactorOverrideData, getEmissionFactorPartOverrideData, getType, ImportEmissionFactor } from './import'

export const applyOverridesFromRows = async (source: Import, rows: ImportEmissionFactor[], dryRun = false) => {
  const efRows = rows.filter((r) => r.Type_Ligne !== 'Poste')
  const partRows = rows.filter((r) => r.Type_Ligne === 'Poste')
  const allImportedIds = [...new Set(efRows.map((r) => r["Identifiant_de_l'élément"]))]

  const existingEFs = await prismaClient.emissionFactor.findMany({
    where: { importedId: { in: allImportedIds }, importedFrom: source },
    select: { id: true, importedId: true, emissionFactorParts: { select: { id: true, type: true } } },
  })
  const efByImportedId = new Map(existingEFs.map((ef) => [ef.importedId!, ef]))
  const notFound = efRows.filter((r) => !efByImportedId.has(r["Identifiant_de_l'élément"])).length

  const wouldUpdate = efRows.filter((r) => efByImportedId.has(r["Identifiant_de_l'élément"])).length
  const total = efRows.length
  const pct = total > 0 ? Math.round((wouldUpdate / total) * 100) : 0
  const partOverrides = partRows.filter((r) => efByImportedId.has(r["Identifiant_de_l'élément"])).length
  console.log(`\n--- Apply Overrides Report ---`)
  console.log(`Found ${total} overrides`)
  console.log(`EFs found in DB: ${pct}% (${wouldUpdate}/${total})`)
  console.log(`Part overrides: ${partOverrides}`)
  if (notFound > 0) {
    console.log(`EFs not found: ${notFound}`)
  }
  console.log(`---------------------\n`)

  if (dryRun) {
    return
  }

  await prismaClient.$transaction(
    async (transaction) => {
      let applied = 0

      for (const row of efRows) {
        const importedId = row["Identifiant_de_l'élément"]
        const ef = efByImportedId.get(importedId)

        if (!ef) {
          console.warn(`  EF not found for importedId "${importedId}" — skipping`)
          continue
        }

        await transaction.emissionFactor.update({
          where: { id: ef.id },
          data: getEmissionFactorOverrideData(row, source, ef.id),
        })

        applied++
      }

      for (const partRow of partRows) {
        const importedId = partRow["Identifiant_de_l'élément"]
        const ef = efByImportedId.get(importedId)
        if (!ef) {
          continue
        }

        const partType = getType(partRow.Type_poste)
        const existingPart = ef.emissionFactorParts.find((p) => p.type === partType)
        if (!existingPart) {
          console.warn(`  Part type "${partRow.Type_poste}" not found for EF "${importedId}" — skipping`)
          continue
        }

        await transaction.emissionFactorPart.update({
          where: { id: existingPart.id },
          data: getEmissionFactorPartOverrideData(partRow, existingPart.id),
        })
      }

      const total = efRows.length
      const pct = total > 0 ? Math.round((applied / total) * 100) : 0
      console.log(`Applied ${applied} overrides, ${pct}% EFs found in DB`)
      if (notFound > 0) {
        console.log(`EFs not found: ${notFound}`)
      }
    },
    { timeout: 20 * MIN * TIME_IN_MS },
  )
}
