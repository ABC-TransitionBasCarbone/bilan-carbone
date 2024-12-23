import { Import } from '@prisma/client'
import axios, { AxiosResponse } from 'axios'
import { prismaClient } from '../../../db/client'
import {
  getEmissionFactorImportVersion,
  ImportEmissionFactor,
  requiredColumns,
  saveEmissionFactorsParts,
  validStatuses,
} from '../import'
import { mapBaseEmpreinteEmissionFactors } from './import'

type EmissionFactorResponse = {
  total: number
  next?: string
  results: ImportEmissionFactor[]
}

export const getEmissionFactorsFromAPI = async (name: string) => {
  const results = await axios.get('https://data.ademe.fr/data-fair/api/v1/datasets/base-carboner')
  const fileName = results.data.file.name

  await prismaClient.$transaction(
    async (transaction) => {
      const emissionFactorImportVersion = await getEmissionFactorImportVersion(
        transaction,
        name,
        Import.BaseEmpreinte,
        fileName,
      )
      if (!emissionFactorImportVersion.success) {
        return console.error('Emission factors already imported with id : ', emissionFactorImportVersion.id)
      }

      let parts: ImportEmissionFactor[] = []
      let url: string | undefined =
        `https://data.ademe.fr/data-fair/api/v1/datasets/base-carboner/lines?select=${requiredColumns.join(',')}&q_fields=Statut_de_l'élément&q=${validStatuses.map((status) => encodeURI(status)).join(',')}`

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
