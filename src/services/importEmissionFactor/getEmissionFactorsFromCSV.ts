import { Import, Prisma } from '@prisma/client'
import { parse } from 'csv-parse'
import fs from 'fs'
import path from 'path'
import { prismaClient } from '../../db/client'
import { getEncoding } from '../../utils/csv'
import { MIN, TIME_IN_MS } from '../../utils/time'
import {
  addSourceToStudies,
  cleanImport,
  getEmissionFactorImportVersion,
  ImportEmissionFactor,
  requiredColumns,
  saveEmissionFactorsParts,
  validStatuses,
} from './import'

const checkHeaders = (headers: string[]) => {
  if (requiredColumns.length > headers.length) {
    throw new Error(`Please check your headers, required headers: ${requiredColumns.join(', ')}`)
  }

  const missingHeaders = requiredColumns.filter((header) => !headers.includes(header))
  if (missingHeaders.length > 0) {
    throw new Error(`Missing headers: ${missingHeaders.join(', ')}`)
  }
}

const numberColumns: (keyof ImportEmissionFactor)[] = [
  'Total_poste_non_décomposé',
  'CO2b',
  'CH4f',
  'CH4b',
  'Autres_GES',
  'N2O',
  'CO2f',
  'Qualité',
  'Qualité_TeR',
  'Qualité_GR',
  'Qualité_TiR',
  'Qualité_C',
  'Valeur_gaz_supplémentaire_1',
  'Valeur_gaz_supplémentaire_2',
]

export const getEmissionFactorsFromCSV = async (
  name: string,
  file: string,
  importFrom: Import,
  mapFunction: (emissionFactor: ImportEmissionFactor, importVersionId: string) => Prisma.EmissionFactorCreateInput,
) => {
  await prismaClient.$transaction(
    async (transaction) => {
      const emissionFactorImportVersion = await getEmissionFactorImportVersion(
        transaction,
        name,
        importFrom,
        path.basename(file),
      )
      if (!emissionFactorImportVersion.success) {
        return console.error('Emission factors already imported with id : ', emissionFactorImportVersion.id)
      }

      console.log('Parse file...')
      const emissionFactors: ImportEmissionFactor[] = []
      const parts: ImportEmissionFactor[] = []

      await new Promise<void>((resolve, reject) => {
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
          .on('end', async () => {
            console.log(`Save ${emissionFactors.length} emission factors...`)
            let i = 0
            for (const emissionFactor of emissionFactors) {
              i++
              if (i % 500 === 0) {
                console.log(`${i}/${emissionFactors.length}...`)
              }
              const data = mapFunction(emissionFactor, emissionFactorImportVersion.id)
              await transaction.emissionFactor.create({ data })
            }
            console.log(`Save ${parts.length} emission factors parts...`)
            await saveEmissionFactorsParts(transaction, emissionFactorImportVersion.id, parts)
            await cleanImport(transaction, emissionFactorImportVersion.id)
            await addSourceToStudies(importFrom, transaction)
            console.log('Done')
            resolve()
          })
          .on('error', (error) => {
            reject(error)
          })
      })
    },
    { timeout: 20 * MIN * TIME_IN_MS },
  )
}
