import { EmissionFactorPartType, Import, Prisma, SubPost, Unit } from '@prisma/client'
import { unitsMatrix } from '../historyUnits'
import { ImportEmissionFactor, mapEmissionFactors, requiredColums } from '../import'

export type LegifranceEmissionFactor = ImportEmissionFactor

export const beRequiredColumns = requiredColums

const getUnit = (value?: string): Unit | null => {
  if (!value) {
    return null
  }
  value = value.replace('kgCO2e/', '')
  if (!unitsMatrix[value]) {
    throw new Error('Unknown unit : ' + value)
  }

  return unitsMatrix[value]
}

const getType = (value: string) => {
  switch (value) {
    case 'Carburant (amont/combustion)':
      return EmissionFactorPartType.CarburantAmontCombustion
    case 'Amont':
      return EmissionFactorPartType.Amont
    case 'Intrants':
      return EmissionFactorPartType.Intrants
    case 'Combustion':
      return EmissionFactorPartType.Combustion
    case 'Transport et distribution':
      return EmissionFactorPartType.TransportEtDistribution
    case 'Energie':
      return EmissionFactorPartType.Energie
    case 'Fabrication':
      return EmissionFactorPartType.Fabrication
    case 'Traitement':
      return EmissionFactorPartType.Traitement
    case 'Collecte':
      return EmissionFactorPartType.Collecte
    case 'Autre':
      return EmissionFactorPartType.Autre
    case 'Amortissement':
      return EmissionFactorPartType.Amortissement
    case 'Incinération':
      return EmissionFactorPartType.Incineration
    case 'Emissions fugitives':
      return EmissionFactorPartType.EmissionsFugitives
    case 'Fuites':
      return EmissionFactorPartType.Fuites
    case 'Transport':
      return EmissionFactorPartType.Transport
    case 'Combustion à la centrale':
      return EmissionFactorPartType.CombustionALaCentrale
    case 'Pertes':
      return EmissionFactorPartType.Pertes
    default:
      throw new Error(`Emission factor type not found: ${value}`)
  }
}

export const mapLegifranceEmissionFactors = (
  emissionFactor: LegifranceEmissionFactor,
  versionId: string,
  reseau: 'froid' | 'chaud',
) => {
  const subPostMatrix = {
    froid: SubPost.ReseauxDeFroid,
    chaud: SubPost.ReseauxDeChaleurEtDeVapeur,
  }
  const getUnitFunc = (emissionFactor: LegifranceEmissionFactor) => getUnit(emissionFactor.Unité_français)
  const getSubPostsFunc = () => [subPostMatrix[reseau]]
  return mapEmissionFactors(emissionFactor, Import.Legifrance, versionId, getUnitFunc, getSubPostsFunc)
}

export const saveEmissionFactorsParts = async (
  transaction: Prisma.TransactionClient,
  parts: LegifranceEmissionFactor[],
) => {
  const emissionFactors = await transaction.emissionFactor.findMany({
    where: {
      importedId: {
        in: parts.map((part) => part["Identifiant_de_l'élément"]),
      },
    },
  })

  for (const i in parts) {
    if (Number(i) % 10 === 0) {
      console.log(`Save part: ${i}/${parts.length}`)
    }
    const part = parts[i]
    const emissionFactor = emissionFactors.find(
      (emissionFactor) => emissionFactor.importedId === part["Identifiant_de_l'élément"],
    )
    if (!emissionFactor) {
      throw new Error('No emission factor found for ' + part["Identifiant_de_l'élément"])
    }

    const metaData = []
    if (part.Nom_poste_français) {
      metaData.push({ title: part.Nom_poste_français, language: 'fr' })
    }
    if (part.Nom_poste_anglais) {
      metaData.push({ title: part.Nom_poste_anglais, language: 'en' })
    }

    const data = {
      emissionFactor: { connect: { id: emissionFactor.id } },
      totalCo2: part.Total_poste_non_décomposé,
      co2f: part.CO2f,
      ch4f: part.CH4f,
      ch4b: part.CH4b,
      n2o: part.N2O,
      co2b: part.CO2b,
      sf6: 0,
      hfc: 0,
      pfc: 0,
      otherGES: part.Autres_GES,
      type: getType(part.Type_poste),
      metaData:
        metaData.length > 0
          ? {
              createMany: {
                data: metaData,
              },
            }
          : undefined,
    } satisfies Prisma.EmissionFactorPartCreateInput

    if (!part.Nom_poste_français && !part.Nom_poste_anglais) {
      delete data.metaData
    }
    await transaction.emissionFactorPart.create({ data })
  }
}
