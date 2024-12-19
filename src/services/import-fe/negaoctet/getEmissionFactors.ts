import { Import } from '@prisma/client'
import { parse } from 'csv-parse'
import fs from 'fs'
import path from 'path'
import { prismaClient } from '../../../db/client'
import { getEmissionFactorImportVersion, ImportEmissionFactor } from '../import'
import { mapNegaOctetEmissionFactors, NegaoctetEmissionFactor, negaoctetRequiredColumns } from './import'

const checkHeaders = (headers: string[]) => {
  if (negaoctetRequiredColumns.length > headers.length) {
    throw new Error(`Please check your headers, required headers: ${negaoctetRequiredColumns.join(', ')}`)
  }

  const missingHeaders = negaoctetRequiredColumns.filter((header) => !headers.includes(header))
  if (missingHeaders.length > 0) {
    throw new Error(`Missing headers: ${missingHeaders.join(', ')}`)
  }
}

const numberColumns: (keyof NegaoctetEmissionFactor)[] = [
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

export const getEmissionFactorsFromCSV = async (name: string, file: string) => {
  await prismaClient.$transaction(
    async (transaction) => {
      const emissionFactorImportVersion = await getEmissionFactorImportVersion(
        transaction,
        name,
        Import.NegaOctet,
        path.basename(file),
      )
      if (!emissionFactorImportVersion.success) {
        return console.error('Emission factors already imported with id : ', emissionFactorImportVersion.id)
      }

      console.log('Parse file...')
      const emissionFactors: ImportEmissionFactor[] = []

      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(file)
          .pipe(
            parse({
              columns: (headers: string[]) => {
                const formattedHeader = headers.map((header) => header.replaceAll(' ', '_'))
                checkHeaders(formattedHeader)
                return formattedHeader
              },
              delimiter: ';',
              encoding: 'utf-8',
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
            emissionFactors.push(row)
          })
          .on('end', async () => {
            console.log(`Save ${emissionFactors.length} emission factors...`)
            let i = 0
            for (const emissionFactor of emissionFactors) {
              i++
              if (i % 500 === 0) {
                console.log(`${i}/${emissionFactors.length}...`)
              }
              const data = mapNegaOctetEmissionFactors(emissionFactor, emissionFactorImportVersion.id)
              await transaction.emissionFactor.create({ data })
            }
            console.log('Done')
            resolve()
          })
          .on('error', (error) => {
            reject(error)
          })
      })
    },
    { timeout: 10 * 60 * 1000 },
  )
}
