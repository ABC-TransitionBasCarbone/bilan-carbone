import { EmissionFactorPartType, EmissionFactorStatus, Import, Prisma, SubPost, Unit } from '@prisma/client'
import { unitsMatrix } from './historyUnits'
import { elementsBySubPost } from './posts.config'

export const validStatuses = ['Valide générique', 'Valide spécifique', 'Archivé']

export const getEmissionFactorImportVersion = async (
  transaction: Prisma.TransactionClient,
  name: string,
  id: string,
) => {
  const existingVersion = await transaction.emissionFactorImportVersion.findFirst({ where: { internId: id } })
  if (existingVersion) {
    return { success: false, id: existingVersion.id }
  }
  const newVersion = await transaction.emissionFactorImportVersion.create({
    data: { name, source: Import.BaseEmpreinte, internId: id },
  })
  return { success: true, id: newVersion.id }
}

export type BaseEmpreinteEmissionFactor = {
  "Identifiant_de_l'élément": string
  "Statut_de_l'élément": string
  Type_Ligne: string
  Source: string
  Type_poste: string
  Localisation_géographique: string
  'Sous-localisation_géographique_français': string
  'Sous-localisation_géographique_anglais': string
  Commentaire_français: string
  Commentaire_anglais: string
  Nom_poste_français: string
  Nom_poste_anglais: string
  Unité_français: string
  Unité_anglais: string
  Tags_français: string
  Tags_anglais: string
  Nom_attribut_français: string
  Nom_attribut_anglais: string
  Nom_base_français: string
  Nom_base_anglais: string
  Nom_frontière_français: string
  Nom_frontière_anglais: string
  Total_poste_non_décomposé: number
  CO2b: number
  CH4f: number
  CH4b: number
  Autres_GES: number
  N2O: number
  CO2f: number
  Incertitude: number
  Qualité: number
  Qualité_TeR: number
  Qualité_GR: number
  Qualité_TiR: number
  Qualité_C: number
  Code_gaz_supplémentaire_1: string
  Valeur_gaz_supplémentaire_1: number
  Code_gaz_supplémentaire_2: string
  Valeur_gaz_supplémentaire_2: number
}

export const requiredColums = [
  "Identifiant_de_l'élément",
  "Statut_de_l'élément",
  'Type_Ligne',
  'Source',
  'Type_poste',
  'Localisation_géographique',
  'Sous-localisation_géographique_français',
  'Sous-localisation_géographique_anglais',
  'Commentaire_français',
  'Commentaire_anglais',
  'Nom_poste_français',
  'Nom_poste_anglais',
  'Unité_français',
  'Unité_anglais',
  'Tags_français',
  'Tags_anglais',
  'Nom_attribut_français',
  'Nom_attribut_anglais',
  'Nom_base_français',
  'Nom_base_anglais',
  'Nom_frontière_français',
  'Nom_frontière_anglais',
  'Total_poste_non_décomposé',
  'CO2b',
  'CH4f',
  'CH4b',
  'Autres_GES',
  'N2O',
  'CO2f',
  'Incertitude',
  'Qualité',
  'Qualité_TeR',
  'Qualité_GR',
  'Qualité_TiR',
  'Qualité_C',
  'Code_gaz_supplémentaire_1',
  'Valeur_gaz_supplémentaire_1',
  'Code_gaz_supplémentaire_2',
  'Valeur_gaz_supplémentaire_2',
]

const escapeTranslation = (value?: string) => (value ? value.replaceAll('"""', '') : value)

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

const getEmissionQuality = (uncertainty?: number) => {
  if (!uncertainty) {
    return null
  } else if (uncertainty < 5) {
    return 5
  } else if (uncertainty < 20) {
    return 4
  } else if (uncertainty < 45) {
    return 3
  } else if (uncertainty < 75) {
    return 2
  } else {
    return 1
  }
}

const getGases = (emissionFactor: BaseEmpreinteEmissionFactor) => {
  const gases = {
    totalCo2: Number(emissionFactor.Total_poste_non_décomposé),
    co2f: Number(emissionFactor.CO2f),
    ch4f: Number(emissionFactor.CH4f),
    ch4b: Number(emissionFactor.CH4b),
    n2o: Number(emissionFactor.N2O),
    co2b: Number(emissionFactor.CO2b),
    sf6: 0,
    hfc: 0,
    pfc: 0,
    otherGES: Number(emissionFactor.Autres_GES),
  }
  if (emissionFactor.Valeur_gaz_supplémentaire_1) {
    if (emissionFactor.Code_gaz_supplémentaire_1 === 'Divers') {
      gases.otherGES = Number(emissionFactor.Valeur_gaz_supplémentaire_1) + gases.otherGES
    }
    if (emissionFactor.Code_gaz_supplémentaire_1 === 'SF6') {
      gases.sf6 = Number(emissionFactor.Valeur_gaz_supplémentaire_1)
    }
  }
  if (emissionFactor.Valeur_gaz_supplémentaire_2) {
    if (emissionFactor.Code_gaz_supplémentaire_2 === 'Divers') {
      gases.otherGES = Number(emissionFactor.Valeur_gaz_supplémentaire_2) + gases.otherGES
    }
    if (emissionFactor.Code_gaz_supplémentaire_2 === 'SF6') {
      gases.sf6 = Number(emissionFactor.Valeur_gaz_supplémentaire_2)
    }
  }
  const totalCo2 = gases.co2f + gases.ch4f + gases.n2o + gases.sf6 + gases.hfc + gases.pfc + gases.otherGES
  if (totalCo2) {
    gases.totalCo2 = totalCo2
  }

  return gases
}

export const mapEmissionFactors = (emissionFactor: BaseEmpreinteEmissionFactor, versionId: string) => {
  return {
    ...getGases(emissionFactor),
    reliability: 5,
    importedFrom: Import.BaseEmpreinte,
    importedId: emissionFactor["Identifiant_de_l'élément"],
    status:
      emissionFactor["Statut_de_l'élément"] === 'Archivé' ? EmissionFactorStatus.Archived : EmissionFactorStatus.Valid,
    source: emissionFactor.Source,
    versionId,
    location: emissionFactor.Localisation_géographique,
    technicalRepresentativeness: emissionFactor.Qualité_TeR || getEmissionQuality(emissionFactor.Incertitude),
    geographicRepresentativeness: emissionFactor.Qualité_GR || getEmissionQuality(emissionFactor.Incertitude),
    temporalRepresentativeness: emissionFactor.Qualité_TiR || getEmissionQuality(emissionFactor.Incertitude),
    completeness: emissionFactor.Qualité_C || getEmissionQuality(emissionFactor.Incertitude),
    unit: getUnit(emissionFactor.Unité_français),
    subPosts: Object.entries(elementsBySubPost)
      .filter(([, elements]) => elements.some((element) => element === emissionFactor["Identifiant_de_l'élément"]))
      .map(([subPost]) => subPost as SubPost),
    metaData: {
      createMany: {
        data: [
          {
            language: 'fr',
            title: escapeTranslation(emissionFactor.Nom_base_français),
            attribute: escapeTranslation(emissionFactor.Nom_attribut_français),
            frontiere: escapeTranslation(emissionFactor.Nom_frontière_français),
            tag: escapeTranslation(emissionFactor.Tags_français),
            location: escapeTranslation(emissionFactor['Sous-localisation_géographique_français']),
            comment: escapeTranslation(emissionFactor.Commentaire_français),
          },
          {
            language: 'en',
            title: escapeTranslation(emissionFactor.Nom_base_anglais),
            attribute: escapeTranslation(emissionFactor.Nom_attribut_anglais),
            frontiere: escapeTranslation(emissionFactor.Nom_frontière_anglais),
            tag: escapeTranslation(emissionFactor.Tags_anglais),
            location: escapeTranslation(emissionFactor['Sous-localisation_géographique_anglais']),
            comment: escapeTranslation(emissionFactor.Commentaire_anglais),
          },
        ],
      },
    },
  }
}

export const saveEmissionFactorsParts = async (
  transaction: Prisma.TransactionClient,
  parts: BaseEmpreinteEmissionFactor[],
) => {
  console.log(`Save ${parts.length} emission factors parts...`)
  const emissionFactors = await transaction.emissionFactor.findMany({
    where: {
      importedId: {
        in: parts.map((part) => part["Identifiant_de_l'élément"]),
      },
    },
  })

  for (const i in parts) {
    if (Number(i) % 100 === 0) {
      console.log(`${i}/${parts.length}`)
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
      ...getGases(part),
      emissionFactor: { connect: { id: emissionFactor.id } },
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

    await transaction.emissionFactorPart.create({ data })
  }
}

export const cleanSums = async (transaction: Prisma.TransactionClient, versionId: string) => {
  console.log('Clean emission factors sums')
  const emissionFactors = await transaction.emissionFactor.findMany({
    where: { versionId },
    include: { emissionFactorParts: true },
  })

  let i = 0
  for (const emissionFactor of emissionFactors) {
    if (Number(i) % 500 === 0) {
      console.log(`Emission factor: ${i}/${emissionFactors.length}`)
    }

    i++
    if (emissionFactor.emissionFactorParts.length === 0) {
      continue
    }

    await transaction.emissionFactor.update({
      where: { id: emissionFactor.id },
      data: {
        co2f: emissionFactor.emissionFactorParts.reduce((sum, part) => sum + (part.co2f || 0), 0),
        ch4f: emissionFactor.emissionFactorParts.reduce((sum, part) => sum + (part.ch4f || 0), 0),
        ch4b: emissionFactor.emissionFactorParts.reduce((sum, part) => sum + (part.ch4b || 0), 0),
        n2o: emissionFactor.emissionFactorParts.reduce((sum, part) => sum + (part.n2o || 0), 0),
        co2b: emissionFactor.emissionFactorParts.reduce((sum, part) => sum + (part.co2b || 0), 0),
        sf6: emissionFactor.emissionFactorParts.reduce((sum, part) => sum + (part.sf6 || 0), 0),
        hfc: emissionFactor.emissionFactorParts.reduce((sum, part) => sum + (part.hfc || 0), 0),
        pfc: emissionFactor.emissionFactorParts.reduce((sum, part) => sum + (part.pfc || 0), 0),
        otherGES: emissionFactor.emissionFactorParts.reduce((sum, part) => sum + (part.otherGES || 0), 0),
        totalCo2: emissionFactor.emissionFactorParts.reduce((sum, part) => sum + (part.totalCo2 || 0), 0),
      },
    })
  }
}
