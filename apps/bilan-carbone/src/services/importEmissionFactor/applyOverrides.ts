import { Import } from '@repo/db-common/enums'
import { prismaClient } from '../../db/client.server'
import { MIN, TIME_IN_MS } from '../../utils/time'
import { getGases, getType, ImportEmissionFactor, mapEmissionFactors, serializeRowAsCsv } from './import'

type MapFunction = (row: ImportEmissionFactor) => ReturnType<typeof mapEmissionFactors>

export const applyOverridesFromRows = async (
  source: Import,
  rows: ImportEmissionFactor[],
  mapFunction: MapFunction,
  dryRun = false,
) => {
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

        const mapped = mapFunction(row)

        await transaction.emissionFactor.update({
          where: { id: ef.id },
          data: {
            totalCo2: mapped.totalCo2,
            co2f: mapped.co2f,
            ch4f: mapped.ch4f,
            ch4b: mapped.ch4b,
            n2o: mapped.n2o,
            co2b: mapped.co2b,
            sf6: mapped.sf6,
            hfc: mapped.hfc,
            pfc: mapped.pfc,
            otherGES: mapped.otherGES,
            unit: mapped.unit,
            isMonetary: mapped.isMonetary,
            status: mapped.status,
            source: mapped.source,
            location: mapped.location,
            overrideRawCsv: serializeRowAsCsv(row),
            metaData: {
              updateMany: mapped.metaData.createMany.data.map((meta) => ({
                where: { emissionFactorId: ef.id, language: meta.language },
                data: {
                  title: meta.title,
                  attribute: meta.attribute,
                  frontiere: meta.frontiere,
                  tag: meta.tag,
                  location: meta.location,
                  comment: meta.comment,
                },
              })),
            },
          },
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

        const gases = getGases(partRow)
        const metaData: { title: string; language: string }[] = []
        if (partRow.Nom_poste_français) {
          metaData.push({ title: partRow.Nom_poste_français, language: 'fr' })
        }
        if (partRow.Nom_poste_anglais) {
          metaData.push({ title: partRow.Nom_poste_anglais, language: 'en' })
        }

        await transaction.emissionFactorPart.update({
          where: { id: existingPart.id },
          data: {
            ...gases,
            overrideRawCsv: serializeRowAsCsv(partRow),
            metaData:
              metaData.length > 0
                ? {
                    updateMany: metaData.map((m) => ({
                      where: { emissionFactorPartId: existingPart.id, language: m.language },
                      data: { title: m.title },
                    })),
                  }
                : undefined,
          },
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
