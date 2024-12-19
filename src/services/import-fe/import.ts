import { EmissionFactorStatus, Import, Prisma, SubPost, Unit } from '@prisma/client'
import { BaseEmpreinteEmissionFactor } from './baseEmpreinte/import'
import { NegaoctetEmissionFactor } from './negaoctet/import'

export const validStatuses = ['Valide générique', 'Valide spécifique', 'Archivé']

export const getEmissionFactorImportVersion = async (
  transaction: Prisma.TransactionClient,
  name: string,
  source: Import,
  id: string,
) => {
  const existingVersion = await transaction.emissionFactorImportVersion.findFirst({ where: { internId: id } })
  if (existingVersion) {
    return { success: false, id: existingVersion.id }
  }
  const newVersion = await transaction.emissionFactorImportVersion.create({
    data: { name, source, internId: id },
  })
  return { success: true, id: newVersion.id }
}

export type ImportEmissionFactor = {
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

export const escapeTranslation = (value?: string) => (value ? value.replaceAll('"""', '') : value)

export const getEmissionQuality = (uncertainty?: number) => {
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
    if (emissionFactor.Code_gaz_supplémentaire_1 === 'SF6') {
      gases.sf6 = Number(emissionFactor.Valeur_gaz_supplémentaire_1)
    } else {
      gases.otherGES = Number(emissionFactor.Valeur_gaz_supplémentaire_1) + gases.otherGES
    }
  }
  if (emissionFactor.Valeur_gaz_supplémentaire_2) {
    if (emissionFactor.Code_gaz_supplémentaire_2 === 'SF6') {
      gases.sf6 = Number(emissionFactor.Valeur_gaz_supplémentaire_2)
    } else {
      gases.otherGES = Number(emissionFactor.Valeur_gaz_supplémentaire_2) + gases.otherGES
    }
  }
  const totalCo2 = gases.co2f + gases.ch4f + gases.n2o + gases.sf6 + gases.hfc + gases.pfc + gases.otherGES
  if (totalCo2) {
    gases.totalCo2 = totalCo2
  }

  return gases
}

export const mapEmissionFactors = (
  emissionFactor: ImportEmissionFactor,
  importedFrom: Import,
  versionId: string,
  getUnit: (emissionFactor: BaseEmpreinteEmissionFactor | NegaoctetEmissionFactor) => Unit | null,
  getSubPost: (emissionFactor: BaseEmpreinteEmissionFactor | NegaoctetEmissionFactor) => SubPost[],
) => {
  const data = {
    ...getGases(emissionFactor),
    reliability: 5,
    importedFrom,
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
    unit: getUnit(emissionFactor),
    subPosts: getSubPost(emissionFactor),
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
