import { parse } from 'csv-parse'
import fs from 'fs'
import path from 'path'
import { prismaClient } from '../../db/client'
import {
  BaseEmpreinteEmissionFactor,
  getEmissionFactorImportVersion,
  mapEmissionFactors,
  requiredColums,
  saveEmissionFactorsParts,
} from './import'

const checkHeaders = (headers: string[]) => {
  if (requiredColums.length > headers.length) {
    throw new Error(`Please check your headers, required headers: ${requiredColums.join(', ')}`)
  }

  const missingHeaders = requiredColums.filter((header) => !headers.includes(header))
  if (missingHeaders.length > 0) {
    throw new Error(`Missing headers: ${missingHeaders.join(', ')}`)
  }
}

const numberColumns: (keyof BaseEmpreinteEmissionFactor)[] = [
  'Incertitude',
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
  const emissionFactorImportVersion = await getEmissionFactorImportVersion(name, path.basename(file))
  if (!emissionFactorImportVersion.success) {
    return console.error('Emission factors already imported with id : ', emissionFactorImportVersion.id)
  }

  console.log('Parse file...')
  const emissionFactors: BaseEmpreinteEmissionFactor[] = []
  const parts: BaseEmpreinteEmissionFactor[] = []
  fs.createReadStream(file)
    .pipe(
      parse({
        columns: (headers: string[]) => {
          const formattedHeader = headers.map((header) => header.replaceAll(' ', '_'))
          checkHeaders(formattedHeader)
          return formattedHeader
        },
        delimiter: ';',
        encoding: 'latin1',
        cast: (value, context) => {
          if (value === '') {
            return undefined
          }

          if (numberColumns.includes(context.column as keyof BaseEmpreinteEmissionFactor)) {
            return Number(value.replace(',', '.'))
          }

          return value
        },
      }),
    )
    .on('data', (row: BaseEmpreinteEmissionFactor) => {
      if (row.Type_Ligne === 'Poste') {
        parts.push(row)
      } else {
        emissionFactors.push(row)
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
        const data = mapEmissionFactors(emissionFactor, emissionFactorImportVersion.id)
        await prismaClient.emissionFactor.create({ data })
      }
      console.log(`Save ${parts.length} emission factors parts...`)
      await saveEmissionFactorsParts(parts)
      console.log('Done')
    })
}
