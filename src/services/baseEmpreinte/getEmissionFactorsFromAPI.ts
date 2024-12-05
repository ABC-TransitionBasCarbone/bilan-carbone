import { Import } from '@prisma/client'
import axios, { AxiosResponse } from 'axios'
import { prismaClient } from '../../db/client'
import {
  BaseEmpreinteEmissionFactor,
  getEmissionFactorImportVersion,
  mapEmissionFactors,
  requiredColums,
  saveEmissionFactorsParts,
} from './import'

const source = Import.BaseEmpreinte

type EmissionFactorResponse = {
  total: number
  next?: string
  results: BaseEmpreinteEmissionFactor[]
}

export const getEmissionFactorsFromAPI = async (name: string) => {
  const results = await axios.get('https://data.ademe.fr/data-fair/api/v1/datasets/base-carboner')
  const fileName = results.data.file.name

  const emissionFactorImportVersion = await getEmissionFactorImportVersion(name, fileName)
  if (!emissionFactorImportVersion.success) {
    return console.error('Emission factors already imported with id : ', emissionFactorImportVersion.id)
  }

  let parts: BaseEmpreinteEmissionFactor[] = []
  let url: string | undefined =
    `https://data.ademe.fr/data-fair/api/v1/datasets/base-carboner/lines?select=${requiredColums.join(',')}&q_fields=Statut_de_l'élément&q=Valide%20générique,Valide%20spécifique,Archivé`

  while (url) {
    const emissionFactors: AxiosResponse<EmissionFactorResponse> = await axios.get<EmissionFactorResponse>(url)
    parts = parts.concat(emissionFactors.data.results.filter((emissionFactor) => emissionFactor.Type_Ligne === 'Poste'))
    const data = emissionFactors.data.results
      .filter((emissionFactor) => emissionFactor.Type_Ligne !== 'Poste')
      .map((emissionFactor) => mapEmissionFactors(emissionFactor, emissionFactorImportVersion.id))

    await Promise.all(data.map((data) => prismaClient.emissionFactor.create({ data })))
    url = emissionFactors.data.next
  }

  await saveEmissionFactorsParts(parts)
}
