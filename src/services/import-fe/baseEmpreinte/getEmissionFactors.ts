import axios, { AxiosResponse } from 'axios'
import { parse } from 'csv-parse'
import fs from 'fs'
import path from 'path'
import { prismaClient } from '../../../db/client'
import { getEmissionFactorImportVersion } from '../import'
import {
  BaseEmpreinteEmissionFactor,
  beRequiredColumns,
  mapBaseEmpreinteEmissionFactors,
  saveEmissionFactorsParts,
} from './import'

const checkHeaders = (headers: string[]) => {
  if (beRequiredColumns.length > headers.length) {
    throw new Error(`Please check your headers, required headers: ${beRequiredColumns.join(', ')}`)
  }

  const missingHeaders = beRequiredColumns.filter((header) => !headers.includes(header))
  if (missingHeaders.length > 0) {
    throw new Error(`Missing headers: ${missingHeaders.join(', ')}`)
  }
}

const numberColumns: (keyof BaseEmpreinteEmissionFactor)[] = [
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

type EmissionFactorResponse = {
  total: number
  next?: string
  results: BaseEmpreinteEmissionFactor[]
}

export const getEmissionFactorsFromCSV = async (name: string, file: string) => {
  await prismaClient.$transaction(
    async (transaction) => {
      const emissionFactorImportVersion = await getEmissionFactorImportVersion(transaction, name, path.basename(file))
      if (!emissionFactorImportVersion.success) {
        return console.error('Emission factors already imported with id : ', emissionFactorImportVersion.id)
      }

      console.log('Parse file...')
      const emissionFactors: BaseEmpreinteEmissionFactor[] = []
      const parts: BaseEmpreinteEmissionFactor[] = []

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
              const data = mapBaseEmpreinteEmissionFactors(emissionFactor, emissionFactorImportVersion.id)
              await transaction.emissionFactor.create({ data })
            }
            console.log(`Save ${parts.length} emission factors parts...`)
            await saveEmissionFactorsParts(transaction, parts)
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

export const getEmissionFactorsFromAPI = async (name: string) => {
  const results = await axios.get('https://data.ademe.fr/data-fair/api/v1/datasets/base-carboner')
  const fileName = results.data.file.name

  await prismaClient.$transaction(
    async (transaction) => {
      const emissionFactorImportVersion = await getEmissionFactorImportVersion(transaction, name, fileName)
      if (!emissionFactorImportVersion.success) {
        return console.error('Emission factors already imported with id : ', emissionFactorImportVersion.id)
      }

      let parts: BaseEmpreinteEmissionFactor[] = []
      let url: string | undefined =
        `https://data.ademe.fr/data-fair/api/v1/datasets/base-carboner/lines?select=${beRequiredColumns.join(',')}&q_fields=Statut_de_l'élément&q=Valide%20générique,Valide%20spécifique,Archivé`

      while (url) {
        console.log(url)
        const emissionFactors: AxiosResponse<EmissionFactorResponse> = await axios.get<EmissionFactorResponse>(url)
        parts = parts.concat(
          emissionFactors.data.results.filter((emissionFactor) => emissionFactor.Type_Ligne === 'Poste'),
        )
        const data = emissionFactors.data.results
          .filter((emissionFactor) => emissionFactor.Type_Ligne !== 'Poste')
          .map((emissionFactor) => mapBaseEmpreinteEmissionFactors(emissionFactor, emissionFactorImportVersion.id))

        await Promise.all(data.map((data) => transaction.emissionFactor.create({ data })))
        url = emissionFactors.data.next
      }

      await saveEmissionFactorsParts(transaction, parts)
    },
    { timeout: 60 * 60 * 1000 },
  )
}
