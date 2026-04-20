import type { Prisma, PrismaClient } from '@abc-transitionbascarbone/db-common'
import { Import } from '@abc-transitionbascarbone/db-common/enums'
import { MIN, TIME_IN_MS } from '@abc-transitionbascarbone/utils'
import { parse } from 'csv-parse'
import fs from 'fs'
import { prismaClient } from '../../db/client.server'
import { getEncoding } from '../../utils/csv'
import {
  addSourceToStudies,
  checkOverrideConflicts,
  cleanImport,
  ConflictReport,
  connectEmissionFactorToVersion,
  DryRunReport,
  getEmissionFactorImportVersion,
  ImportEmissionFactor,
  isEmissionFactorUnchanged,
  numberColumns,
  propagateOverrides,
  requiredColumns,
  saveEmissionFactorsParts,
  validStatuses,
} from './import'

export type OverrideMode = 'keep' | 'discard' | 'none'

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

type ExistingEF = Prisma.EmissionFactorGetPayload<{ include: { metaData: true } }>

type AnalysisResult = {
  importedIds: string[]
  existingByImportedId: Map<string, ExistingEF>
  partsByImportedId: Map<string, ImportEmissionFactor[]>
  changedEfs: { importedId: string; efId: string }[]
  newCount: number
  reusedCount: number
  removedCount: number
  conflicts: ConflictReport[]
}

const analyzeImport = async (
  client: PrismaClient | Prisma.TransactionClient,
  emissionFactors: ImportEmissionFactor[],
  parts: ImportEmissionFactor[],
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
    include: { metaData: true },
  })
  const existingByImportedId = new Map(existingEFs.map((ef) => [ef.importedId!, ef]))

  const partsByImportedId = new Map<string, ImportEmissionFactor[]>()
  for (const part of parts) {
    const id = part["Identifiant_de_l'élément"]
    const existing = partsByImportedId.get(id) ?? []
    existing.push(part)
    partsByImportedId.set(id, existing)
  }

  const changedEfs: { importedId: string; efId: string }[] = []
  let reusedCount = 0
  let newCount = 0

  for (const emissionFactor of emissionFactors) {
    const importedId = emissionFactor["Identifiant_de_l'élément"]
    const existing = existingByImportedId.get(importedId)
    const efParts = partsByImportedId.get(importedId) ?? []
    if (existing && isEmissionFactorUnchanged(existing, emissionFactor, efParts)) {
      reusedCount++
    } else if (existing) {
      changedEfs.push({ importedId, efId: existing.id })
    } else {
      newCount++
    }
  }

  const conflicts = await checkOverrideConflicts(client, changedEfs)

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
    partsByImportedId,
    changedEfs,
    newCount,
    reusedCount,
    removedCount,
    conflicts,
  }
}

const logReport = (label: string, { newCount, updatedCount, reusedCount, removedCount, conflicts }: DryRunReport) => {
  console.log(`\n--- ${label} ---`)
  console.log(`New EFs (not in any previous version): ${newCount}`)
  console.log(`Updated EFs (values changed, new row will be created): ${updatedCount}`)
  console.log(`Reused EFs (unchanged, existing row reused): ${reusedCount}`)
  console.log(`Removed EFs (in previous version but absent from this import): ${removedCount}`)
  console.log(`Conflicts with existing overrides: ${conflicts.length}`)
  for (const c of conflicts) {
    console.log(`  importedId: ${c.importedId}`)
  }
  console.log(`---------------------\n`)
}

export const getEmissionFactorsFromCSV = async (
  name: string,
  file: string,
  importFrom: Import,
  mapFunction: (emissionFactor: ImportEmissionFactor) => Prisma.EmissionFactorCreateInput,
  options: { dryRun?: boolean; overrideMode?: OverrideMode } = {},
): Promise<DryRunReport | void> => {
  const { dryRun = false, overrideMode = 'none' } = options

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
    const { changedEfs, newCount, reusedCount, removedCount, conflicts } = await analyzeImport(
      prismaClient,
      emissionFactors,
      parts,
      importFrom,
      previousVersion?.id,
    )
    const report: DryRunReport = {
      newCount,
      updatedCount: changedEfs.length,
      reusedCount,
      removedCount,
      conflicts,
    }
    logReport('Dry Run Report', report)
    return report
  }

  return prismaClient.$transaction(
    async (transaction) => {
      const emissionFactorImportVersion = await getEmissionFactorImportVersion(transaction, name, importFrom)
      const importVersionId = emissionFactorImportVersion.id

      const { existingByImportedId, partsByImportedId, newCount, reusedCount, removedCount, conflicts } =
        await analyzeImport(transaction, emissionFactors, parts, importFrom, previousVersion?.id)

      if (conflicts.length > 0 && overrideMode === 'none') {
        console.error(`\n⚠️  ${conflicts.length} conflict(s) detected with existing overrides:`)
        for (const c of conflicts) {
          console.error(`  importedId: ${c.importedId}`)
        }
        console.error(`\nRe-run with --keep-overrides or --discard-overrides to proceed.\n`)
        process.exit(1)
      }

      const importedIdToEfId = new Map<string, string>()
      const newEmissionFactorIds: string[] = []
      const oldToNewEfId: { oldId: string; newId: string }[] = []

      let i = 0
      for (const emissionFactor of emissionFactors) {
        i++
        if (i % 500 === 0) {
          console.log(`${i}/${emissionFactors.length}...`)
        }

        const importedId = emissionFactor["Identifiant_de_l'élément"]
        const existing = existingByImportedId.get(importedId)

        const efParts = partsByImportedId.get(importedId) ?? []
        if (existing && isEmissionFactorUnchanged(existing, emissionFactor, efParts)) {
          await connectEmissionFactorToVersion(transaction, existing.id, importVersionId)
          importedIdToEfId.set(importedId, existing.id)
        } else {
          const data = mapFunction(emissionFactor)
          const created = await transaction.emissionFactor.create({
            data: { ...data, versions: { create: { importVersionId } } },
          })
          importedIdToEfId.set(importedId, created.id)
          newEmissionFactorIds.push(created.id)
          if (existing) {
            oldToNewEfId.push({ oldId: existing.id, newId: created.id })
          }
        }
      }

      if (overrideMode === 'keep' && oldToNewEfId.length > 0) {
        await propagateOverrides(transaction, oldToNewEfId)
      }

      logReport(`Import Report (overrideMode: ${overrideMode})`, {
        newCount,
        updatedCount: oldToNewEfId.length,
        reusedCount,
        removedCount,
        conflicts,
      })

      console.log(`Save ${parts.length} emission factors parts...`)
      await saveEmissionFactorsParts(transaction, importedIdToEfId, parts)
      await cleanImport(transaction, newEmissionFactorIds)

      await addSourceToStudies(importFrom, transaction)

      console.log('Done')
    },
    { timeout: 20 * MIN * TIME_IN_MS },
  )
}
