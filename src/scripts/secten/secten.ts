import { parseFloatString } from '@/utils/number'
import { Prisma } from '@prisma/client'
import { parse } from 'csv-parse'
import fs from 'fs'
import { prismaClient } from '../../db/client'

type SectenRow = {
  sector: string
  values: (number | undefined)[]
}

export type SectenData = {
  year: number
  energy: number
  industry: number
  waste: number
  buildings: number
  agriculture: number
  transportation: number
  total: number
}

const SECTOR_MAP: Record<string, keyof Omit<SectenData, 'year'>> = {
  "Production d'énergie": 'energy',
  Industrie: 'industry',
  Déchets: 'waste',
  Bâtiments: 'buildings',
  Agriculture: 'agriculture',
  Transports: 'transportation',
  Total: 'total',
}

// Values are in French float format with comma and in Mt but stored in tonnes
const parseSectenValue = (value: string): number | undefined => {
  const parsed = parseFloatString(value)
  if (parsed === undefined) {
    return undefined
  }
  return Math.round(parsed * 1000)
}

const assignVersionToSectenInfo = (versionId: string, data: SectenData[]) => {
  return data.map((row) => ({
    versionId,
    ...row,
  }))
}

export const parseSectenCSV = async (filePath: string): Promise<SectenData[]> => {
  return new Promise((resolve, reject) => {
    const rows: string[][] = []

    fs.createReadStream(filePath)
      .pipe(
        parse({
          delimiter: ';',
          from_line: 1,
          relax_column_count: true,
        }),
      )
      .on('data', (row: string[]) => {
        rows.push(row)
      })
      .on('end', () => {
        try {
          if (rows.length < 8) {
            throw new Error(`Invalid CSV structure: expected at least 8 rows, got ${rows.length}`)
          }

          const years = rows[0]
            .slice(1)
            .map((yearStr) => parseInt(yearStr, 10))
            .filter((year) => !isNaN(year))

          if (years.length === 0) {
            throw new Error('No valid years found in CSV header')
          }

          const sectorRows: SectenRow[] = rows.slice(1, 8).map((row) => ({
            sector: row[0],
            values: row.slice(1).map(parseSectenValue),
          }))

          const result: SectenData[] = []

          for (let yearIndex = 0; yearIndex < years.length; yearIndex++) {
            const yearData: Partial<SectenData> = { year: years[yearIndex] }
            let hasValues = false

            for (const sectorRow of sectorRows) {
              const fieldName = SECTOR_MAP[sectorRow.sector]
              if (fieldName && yearIndex < sectorRow.values.length) {
                const yearSectorValue = sectorRow.values[yearIndex]
                if (yearSectorValue !== undefined) {
                  hasValues = true
                  yearData[fieldName] = yearSectorValue
                }
              }
            }

            if (hasValues) {
              // Only add years with at least one value
              result.push(yearData as SectenData)
            }
          }

          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

export const getSectenVersion = async (transaction: Prisma.TransactionClient, name: string) => {
  const existingVersion = await transaction.sectenVersion.findUnique({
    where: { name },
  })

  if (existingVersion) {
    return { success: false, id: existingVersion.id, version: existingVersion }
  }

  const newVersion = await transaction.sectenVersion.create({
    data: { name },
  })

  return { success: true, id: newVersion.id, version: newVersion }
}

export const updateSectenVersion = async (
  transaction: Prisma.TransactionClient,
  versionId: string,
  data: SectenData[],
) => {
  await transaction.sectenInfo.deleteMany({
    where: { versionId },
  })

  await transaction.sectenInfo.createMany({
    data: assignVersionToSectenInfo(versionId, data),
  })
}

export const importSectenData = async (name: string, filePath: string, shouldUpdate: boolean = false) => {
  const data = await parseSectenCSV(filePath)

  return prismaClient.$transaction(async (transaction) => {
    const versionResult = await getSectenVersion(transaction, name)

    if (!versionResult.success && !shouldUpdate) {
      console.error('Version already exists:', versionResult.id)
      return { success: false, message: 'Version exists', versionId: versionResult.id }
    }

    if (!versionResult.success && shouldUpdate) {
      await updateSectenVersion(transaction, versionResult.id, data)
      console.log('Version updated:', versionResult.id)
      return { success: true, message: 'Updated', versionId: versionResult.id }
    }

    await transaction.sectenInfo.createMany({
      data: assignVersionToSectenInfo(versionResult.id, data),
    })

    console.log('Version created:', versionResult.id)
    return { success: true, message: 'Created', versionId: versionResult.id }
  })
}
