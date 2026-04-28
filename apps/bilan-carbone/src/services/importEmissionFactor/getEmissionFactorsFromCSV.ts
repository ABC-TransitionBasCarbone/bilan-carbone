import type { Prisma, PrismaClient } from '@abc-transitionbascarbone/db-common'
import { Import } from '@abc-transitionbascarbone/db-common/enums'
import { MIN, TIME_IN_MS } from '@abc-transitionbascarbone/utils'
import { parse } from 'csv-parse'
import fs from 'fs'
import { prismaClient } from '../../db/client.server'
import { getEncoding } from '../../utils/csv'
import {
  addSourceToStudies,
  cleanImport,
  connectEmissionFactorToVersion,
  getEmissionFactorImportVersion,
  ImportEmissionFactor,
  isRowUnchanged,
  mergeRowWithOverride,
  numberColumns,
  propagatePartOverrides,
  requiredColumns,
  saveEmissionFactorsParts,
  serializeRowAsCsv,
  validStatuses,
} from './import'

export type DryRunReport = {
  newCount: number
  updatedCount: number
  reusedCount: number
  removedCount: number
  overriddenAndUpdatedCount: number
}

const checkHeaders = (headers: string[]) => {
  if (requiredColumns.length > headers.length) {
    throw new Error(`Please check your headers, required headers: ${requiredColumns.join(', ')}`)
  }

  const missingHeaders = requiredColumns.filter((header) => !headers.includes(header))
  if (missingHeaders.length > 0) {
    throw new Error(`Missing headers: ${missingHeaders.join(', ')}`)
  }
}

export const parseCSVRows = (
  file: string,
): Promise<{ emissionFactors: ImportEmissionFactor[]; parts: ImportEmissionFactor[] }> =>
  new Promise((resolve, reject) => {
    const emissionFactors: ImportEmissionFactor[] = []
    const parts: ImportEmissionFactor[] = []
    fs.createReadStream(file)
      .pipe(
        parse({
          columns: (headers: string[]) => {
            const formattedHeader = headers.map((header) => header.trim().replaceAll(' ', '_'))
            checkHeaders(formattedHeader)
            return formattedHeader
          },
          delimiter: ';',
          encoding: getEncoding(file),
          cast: (value, context) => {
            if (value === '') {
              return undefined
            }
            if (numberColumns.includes(context.column as keyof ImportEmissionFactor)) {
              return Number(value.replace(',', '.'))
            }
            return value
          },
        }),
      )
      .on('data', (row: ImportEmissionFactor) => {
        if (validStatuses.includes(row["Statut_de_l'élément"])) {
          if (row.Type_Ligne === 'Poste') {
            parts.push(row)
          } else {
            emissionFactors.push(row)
          }
        }
      })
      .on('end', () => resolve({ emissionFactors, parts }))
      .on('error', reject)
  })

type ExistingEF = Prisma.EmissionFactorGetPayload<{
  select: { id: true; importedId: true; importedRawCsv: true; overrideRawCsv: true }
}>

type AnalysisResult = {
  importedIds: string[]
  existingByImportedId: Map<string, ExistingEF>
  changedEfs: { importedId: string; efId: string }[]
  overriddenAndUpdatedCount: number
  newCount: number
  reusedCount: number
  removedCount: number
}

const analyzeImport = async (
  client: PrismaClient | Prisma.TransactionClient,
  emissionFactors: ImportEmissionFactor[],
  importFrom: Import,
  previousVersionId: string | undefined,
): Promise<AnalysisResult> => {
  const importedIds = emissionFactors.map((ef) => ef["Identifiant_de_l'élément"])

  const existingEFs = await client.emissionFactor.findMany({
    where: {
      importedId: { in: importedIds },
      importedFrom: importFrom,
      ...(previousVersionId ? { versions: { some: { importVersionId: previousVersionId } } } : {}),
    },
    select: { id: true, importedId: true, importedRawCsv: true, overrideRawCsv: true },
  })
  const existingByImportedId = new Map(existingEFs.map((ef) => [ef.importedId!, ef]))

  const changedEfs: { importedId: string; efId: string }[] = []
  let reusedCount = 0
  let newCount = 0
  let overriddenAndUpdatedCount = 0

  for (const emissionFactor of emissionFactors) {
    const importedId = emissionFactor["Identifiant_de_l'élément"]
    const existing = existingByImportedId.get(importedId)
    if (existing?.importedRawCsv && isRowUnchanged(existing.importedRawCsv, emissionFactor)) {
      reusedCount++
    } else if (existing) {
      if (existing.overrideRawCsv) {
        overriddenAndUpdatedCount++
      }
      changedEfs.push({ importedId, efId: existing.id })
    } else {
      newCount++
    }
  }

  let removedCount = 0
  if (previousVersionId) {
    const previousImportedIds = await client.emissionFactor.findMany({
      where: { importedFrom: importFrom, versions: { some: { importVersionId: previousVersionId } } },
      select: { importedId: true },
    })
    const incomingIdSet = new Set(importedIds)
    removedCount = previousImportedIds.filter((ef) => ef.importedId && !incomingIdSet.has(ef.importedId)).length
  }

  return {
    importedIds,
    existingByImportedId,
    changedEfs,
    overriddenAndUpdatedCount,
    newCount,
    reusedCount,
    removedCount,
  }
}

const logReport = (
  label: string,
  { newCount, updatedCount, reusedCount, removedCount, overriddenAndUpdatedCount }: DryRunReport,
) => {
  console.log(`\n--- ${label} ---`)
  console.log(`New EFs (not in any previous version): ${newCount}`)
  console.log(`Updated EFs (values changed, new row will be created): ${updatedCount}`)
  console.log(
    `Conflicts (updated EFs with manual overrides — require --keep-overrides or --discard-overrides): ${overriddenAndUpdatedCount}`,
  )
  console.log(`Reused EFs (unchanged, existing row reused): ${reusedCount}`)
  console.log(`Removed EFs (in previous version but absent from this import): ${removedCount}`)
  console.log(`---------------------\n`)
}

export type OverrideMode = 'keep' | 'discard'

export const getEmissionFactorsFromCSV = async (
  name: string,
  file: string,
  importFrom: Import,
  mapFunction: (emissionFactor: ImportEmissionFactor) => Prisma.EmissionFactorCreateInput,
  options: { dryRun?: boolean; overrideMode?: OverrideMode } = {},
): Promise<DryRunReport | void> => {
  const { dryRun = false, overrideMode } = options

  const existingVersion = await prismaClient.emissionFactorImportVersion.findFirst({
    where: { name, source: importFrom },
  })
  if (existingVersion) {
    console.error(
      `Version "${name}" already exists for source "${importFrom}". Use a different name or use the override script.`,
    )
    process.exit(1)
  }

  console.log('Parse file...')
  const { emissionFactors, parts } = await parseCSVRows(file)
  console.log(`Processing ${emissionFactors.length} emission factors...`)

  const previousVersion = await prismaClient.emissionFactorImportVersion.findFirst({
    where: { source: importFrom, emissionFactorVersions: { some: {} } },
    orderBy: { createdAt: 'desc' },
  })

  if (dryRun) {
    const { changedEfs, overriddenAndUpdatedCount, newCount, reusedCount, removedCount } = await analyzeImport(
      prismaClient,
      emissionFactors,
      importFrom,
      previousVersion?.id,
    )
    const report: DryRunReport = {
      newCount,
      updatedCount: changedEfs.length,
      reusedCount,
      removedCount,
      overriddenAndUpdatedCount,
    }
    logReport('Dry Run Report', report)
    return report
  }

  const { existingByImportedId, changedEfs, overriddenAndUpdatedCount, newCount, reusedCount, removedCount } =
    await analyzeImport(prismaClient, emissionFactors, importFrom, previousVersion?.id)

  if (overriddenAndUpdatedCount > 0 && !overrideMode) {
    console.error(`\n⚠️  ${overriddenAndUpdatedCount} EF(s) have manual overrides and their CSV row has changed.`)
    console.error(`   Use --keep-overrides to propagate existing overrides onto the new EF values.`)
    console.error(`   Use --discard-overrides to import the new CSV values and discard manual overrides.`)
    process.exit(1)
  }

  return prismaClient.$transaction(
    async (transaction) => {
      const emissionFactorImportVersion = await getEmissionFactorImportVersion(transaction, name, importFrom)
      const importVersionId = emissionFactorImportVersion.id

      const importedIdToEfId = new Map<string, string>()
      const newEmissionFactorIds: string[] = []
      const reusedEfIds = new Set<string>()
      // Maps new EF id → old EF id, for EFs where override was merged (to propagate to parts)
      const mergedOverrideEfIds = new Map<string, string>()

      let i = 0
      for (const emissionFactor of emissionFactors) {
        i++
        if (i % 500 === 0) {
          console.log(`${i}/${emissionFactors.length}...`)
        }

        const importedId = emissionFactor["Identifiant_de_l'élément"]
        const existing = existingByImportedId.get(importedId)

        if (existing?.importedRawCsv && isRowUnchanged(existing.importedRawCsv, emissionFactor)) {
          await connectEmissionFactorToVersion(transaction, existing.id, importVersionId)
          importedIdToEfId.set(importedId, existing.id)
          reusedEfIds.add(existing.id)
        } else {
          const shouldMergeOverride = overrideMode === 'keep' && existing?.overrideRawCsv && existing?.importedRawCsv
          const rowToMap = shouldMergeOverride
            ? mergeRowWithOverride(emissionFactor, existing.importedRawCsv!, existing.overrideRawCsv!)
            : emissionFactor
          const data = mapFunction(rowToMap)
          const created = await transaction.emissionFactor.create({
            data: {
              ...data,
              importedRawCsv: serializeRowAsCsv(emissionFactor),
              ...(shouldMergeOverride ? { overrideRawCsv: serializeRowAsCsv(rowToMap) } : {}),
              versions: { create: { importVersionId } },
            },
          })
          importedIdToEfId.set(importedId, created.id)
          newEmissionFactorIds.push(created.id)
          if (shouldMergeOverride && existing) {
            mergedOverrideEfIds.set(created.id, existing.id)
          }
        }
      }

      logReport('Import Report', {
        newCount,
        updatedCount: changedEfs.length,
        reusedCount,
        removedCount,
        overriddenAndUpdatedCount,
      })

      console.log(`Save ${parts.length} emission factors parts...`)
      await saveEmissionFactorsParts(transaction, importedIdToEfId, parts, reusedEfIds)
      await propagatePartOverrides(transaction, mergedOverrideEfIds)
      await cleanImport(transaction, newEmissionFactorIds)

      await addSourceToStudies(importFrom, transaction)

      console.log('Done')
    },
    { timeout: 20 * MIN * TIME_IN_MS },
  )
}
