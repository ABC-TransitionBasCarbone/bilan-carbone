import { EmissionFactorPartType, Import, Prisma, SubPost, Unit } from '@prisma/client'
import { unitsMatrix } from '../historyUnits'
import { ImportEmissionFactor, mapEmissionFactors, requiredColums } from '../import'
import { elementsBySubPost } from '../posts.config'

export type BaseEmpreinteEmissionFactor = ImportEmissionFactor

export const beRequiredColumns = requiredColums

const getUnit = (value?: string): Unit | null => {
  if (!value) {
    return null
  }
  if (value.startsWith('kgCO2e/')) {
    value = value.replace('kgCO2e/', '')
  }
  if (value.toLowerCase() === 'tep pci') {
    value = 'tep PCI'
  } else if (value.toLowerCase() === 'tep pcs') {
    value = 'tep PCS'
  } else if (value.toLowerCase() === 'ha') {
    value = 'ha'
  } else if (value.toLowerCase() === 'kg') {
    value = 'kg'
  } else if (value.toLowerCase() === 'litre') {
    value = 'litre'
  } else if (['kWh (PCI)', 'KWh PCI', 'kWhPCI'].includes(value)) {
    value = 'kWh PCI'
  } else if (value === 'kWhPCS') {
    value = 'kWh PCS'
  } else if (value === 'm2 SHON') {
    value = 'm² SHON'
  } else if (value.includes('m3')) {
    value = value.replace('m3', 'm³')
  }

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
    default:
      throw new Error(`Emission factor type not found: ${value}`)
  }
}

export const mapBaseEmpreinteEmissionFactors = (emissionFactor: BaseEmpreinteEmissionFactor, versionId: string) => {
  const getUnitFunc = (emissionFactor: BaseEmpreinteEmissionFactor) => getUnit(emissionFactor.Unité_français)
  const getSubPostsFunc = (emissionFactor: BaseEmpreinteEmissionFactor) =>
    Object.entries(elementsBySubPost)
      .filter(([, elements]) => elements.some((element) => element === emissionFactor["Identifiant_de_l'élément"]))
      .map(([subPost]) => subPost as SubPost)

  return mapEmissionFactors(emissionFactor, Import.BaseEmpreinte, versionId, getUnitFunc, getSubPostsFunc)
}

export const saveEmissionFactorsParts = async (
  transaction: Prisma.TransactionClient,
  parts: BaseEmpreinteEmissionFactor[],
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
    if (part.Valeur_gaz_supplémentaire_1) {
      const type = part.Code_gaz_supplémentaire_1 || (emissionFactor.sf6 ? 'SF6' : 'Divers')
      if (type === 'Divers') {
        data.otherGES = part.Valeur_gaz_supplémentaire_1 + (data.otherGES || 0)
      }
      if (type === 'SF6') {
        data.sf6 = part.Valeur_gaz_supplémentaire_1
      }
    }
    if (part.Valeur_gaz_supplémentaire_2) {
      const type = part.Code_gaz_supplémentaire_2 || (emissionFactor.sf6 ? 'SF6' : 'Divers')
      if (type === 'Divers') {
        data.otherGES = part.Valeur_gaz_supplémentaire_2 + (data.otherGES || 0)
      }
      if (type === 'SF6') {
        data.sf6 = part.Valeur_gaz_supplémentaire_2
      }
    }
    await transaction.emissionFactorPart.create({ data })
  }
}
