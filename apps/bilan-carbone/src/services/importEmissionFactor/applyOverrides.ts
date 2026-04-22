import type { Prisma } from '@repo/db-common'
import { Import } from '@repo/db-common/enums'
import { prismaClient } from '../../db/client.server'
import { MIN, TIME_IN_MS } from '../../utils/time'
import { ImportEmissionFactor, mapEmissionFactors } from './import'

type MapFunction = (row: ImportEmissionFactor) => ReturnType<typeof mapEmissionFactors>

const pickGasFields = (mapped: ReturnType<typeof mapEmissionFactors>) => ({
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
})

const buildOverrideData = (mapped: ReturnType<typeof mapEmissionFactors>) => ({
  ...pickGasFields(mapped),
  unit: mapped.unit,
  status: mapped.status,
  source: mapped.source,
  location: mapped.location,
  metaData: {
    createMany: {
      data: mapped.metaData.createMany.data,
    },
  },
})

export const applyOverridesFromRows = async (
  source: Import,
  rows: ImportEmissionFactor[],
  mapFunction: MapFunction,
  dryRun = false,
) => {
  const efRows = rows.filter((r) => r.Type_Ligne !== 'Poste')
  const partRows = rows.filter((r) => r.Type_Ligne === 'Poste')
  const allImportedIds = [...new Set(rows.map((r) => r["Identifiant_de_l'élément"]))]

  const existingEFs = await prismaClient.emissionFactor.findMany({
    where: { importedId: { in: allImportedIds }, importedFrom: source },
    select: { id: true, importedId: true },
  })
  const efByImportedId = new Map(existingEFs.map((ef) => [ef.importedId!, ef.id]))

  const notFound = efRows.filter((r) => !efByImportedId.has(r["Identifiant_de_l'élément"])).length
  const foundIds = [...efByImportedId.values()]

  const existingOverrides = await prismaClient.emissionFactorOverride.findMany({
    where: { emissionFactorId: { in: foundIds } },
    select: { emissionFactorId: true },
  })
  const wouldCreate = foundIds.filter((id) => !existingOverrides.some((o) => o.emissionFactorId === id)).length
  const wouldUpdate = existingOverrides.length

  if (dryRun) {
    console.log(`\n--- Dry Run Report ---`)
    console.log(`Overrides to create: ${wouldCreate}`)
    console.log(`Overrides to update: ${wouldUpdate}`)
    console.log(`EFs not found: ${notFound}`)
    console.log(`---------------------\n`)
    return
  }

  await prismaClient.$transaction(
    async (transaction) => {
      // Delete in cascade all existing overrides for the EFs in the file, then recreate from scratch
      await transaction.emissionFactorOverride.deleteMany({
        where: { emissionFactorId: { in: foundIds } },
      })

      let applied = 0

      for (const row of efRows) {
        const importedId = row["Identifiant_de_l'élément"]
        const efId = efByImportedId.get(importedId)

        if (!efId) {
          console.warn(`  EF not found for importedId "${importedId}" — skipping`)
          continue
        }

        const mapped = mapFunction(row)
        const overrideData = buildOverrideData(mapped)

        const partRowsForEf = partRows.filter((p) => p["Identifiant_de_l'élément"] === importedId)

        await transaction.emissionFactorOverride.create({
          data: {
            emissionFactor: { connect: { id: efId } },
            ...overrideData,
            parts: {
              create: partRowsForEf.map((part) => {
                const mappedPart = mapEmissionFactors(part, source, () => [])
                const metaData = []
                if (part.Nom_poste_français) {
                  metaData.push({ language: 'fr', title: part.Nom_poste_français })
                }
                if (part.Nom_poste_anglais) {
                  metaData.push({ language: 'en', title: part.Nom_poste_anglais })
                }
                return {
                  type: part.Type_poste as Prisma.EmissionFactorOverridePartCreateManyInput['type'],
                  ...pickGasFields(mappedPart),
                  metaData: metaData.length > 0 ? { createMany: { data: metaData } } : undefined,
                }
              }),
            },
          },
        })

        applied++
      }

      console.log(`Applied ${applied} overrides, ${notFound} EFs not found`)
    },
    { timeout: 20 * MIN * TIME_IN_MS },
  )
}
