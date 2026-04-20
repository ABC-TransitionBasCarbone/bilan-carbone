import type { PrismaClient } from '@abc-transitionbascarbone/db-common'
import { Import } from '@abc-transitionbascarbone/db-common/enums'
import { HOUR, TIME_IN_MS } from '@abc-transitionbascarbone/utils'
import axios, { AxiosResponse } from 'axios'
import {
  addSourceToStudies,
  cleanImport,
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

export const getEmissionFactorsFromAPI = async (prismaClient: PrismaClient, name: string) => {
  await axios.get('https://data.ademe.fr/data-fair/api/v1/datasets/base-carboner')

  await prismaClient.$transaction(
    async (transaction) => {
      const emissionFactorImportVersion = await getEmissionFactorImportVersion(transaction, name, Import.BaseEmpreinte)
      if (emissionFactorImportVersion.alreadyExists) {
        return console.error('Emission factors already imported with id : ', emissionFactorImportVersion.id)
      }

      let parts: ImportEmissionFactor[] = []
      const importedIdToEfId = new Map<string, string>()
      const newEmissionFactorIds: string[] = []
      let url: string | undefined =
        `https://data.ademe.fr/data-fair/api/v1/datasets/base-carboner/lines?select=${requiredColumns.join(',')}&q_fields=Statut_de_l'élément&q=${validStatuses.map((status) => encodeURI(status)).join(',')}`

      while (url) {
        console.log(url)
        const emissionFactors: AxiosResponse<EmissionFactorResponse> = await axios.get<EmissionFactorResponse>(url)
        parts = parts.concat(
          emissionFactors.data.results.filter((emissionFactor) => emissionFactor.Type_Ligne === 'Poste'),
        )
        const efRows = emissionFactors.data.results.filter((emissionFactor) => emissionFactor.Type_Ligne !== 'Poste')
        for (const row of efRows) {
          const data = mapBaseEmpreinteEmissionFactors(row)
          const created = await transaction.emissionFactor.create({
            data: {
              ...data,
              versions: { create: { importVersionId: emissionFactorImportVersion.id } },
            },
          })
          importedIdToEfId.set(row["Identifiant_de_l'élément"], created.id)
          newEmissionFactorIds.push(created.id)
        }
        url = emissionFactors.data.next
      }

      await saveEmissionFactorsParts(transaction, importedIdToEfId, parts)
      await cleanImport(transaction, newEmissionFactorIds)
      await addSourceToStudies(Import.BaseEmpreinte, transaction)
    },
    { timeout: HOUR * TIME_IN_MS },
  )
}
