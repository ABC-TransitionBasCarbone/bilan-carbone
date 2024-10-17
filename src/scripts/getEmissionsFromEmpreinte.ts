import { prismaClient } from '../db/client'
import { EmissionStatus, EmissionType, Import } from '@prisma/client'
import axios from 'axios'

type EmissionResponse = {
  total: number
  next?: string
  results: {
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
    Incertitude: number
    Total_poste_non_décomposé: number
    CO2b: number
    CH4f: number
    CH4b: number
    Autres_GES: number
    N2O: number
    CO2f: number
    Qualité_TeR: number
    Qualité_GR: number
    Qualité_TiR: number
    Qualité_C: number
  }[]
}
const select = [
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
  'Incertitude',
  'Total_poste_non_décomposé',
  'CO2b',
  'CH4f',
  'CH4b',
  'Autres_GES',
  'N2O',
  'CO2f',
  'Qualité_TeR',
  'Qualité_GR',
  'Qualité_TiR',
  'Qualité_C',
]

const validStatus = ['Valide générique', 'Valide spécifique', 'Archivé']

const saveEmissions = async (url: string) => {
  const emissions = await axios.get<EmissionResponse>(url)
  await Promise.all(
    emissions.data.results
      .filter((emission) => validStatus.includes(emission["Statut_de_l'élément"]))
      .map((emission) =>
        prismaClient.emission.create({
          data: {
            importedFrom: Import.BaseEmpreinte,
            importedId: emission["Identifiant_de_l'élément"],
            status: emission["Statut_de_l'élément"] === 'Archivé' ? EmissionStatus.Archived : EmissionStatus.Valid,
            type: emission.Type_Ligne === 'Poste' ? EmissionType.Post : EmissionType.Element,
            source: emission.Source,
            location: emission.Localisation_géographique,
            incertitude: emission.Incertitude,
            technicalRepresentativeness: emission.Qualité_TeR,
            geographicRepresentativeness: emission.Qualité_GR,
            temporalRepresentativeness: emission.Qualité_TiR,
            completeness: emission.Qualité_C,
            post: emission.Type_poste,
            totalCo2: emission.Total_poste_non_décomposé,
            co2f: emission.CO2f,
            ch4f: emission.CH4f,
            ch4b: emission.CH4b,
            n2o: emission.N2O,
            co2b: emission.CO2b,
            otherGES: emission.Autres_GES,
            metaData: {
              createMany: {
                data: [
                  {
                    language: 'fr',
                    title: emission.Nom_base_français,
                    attribute: emission.Nom_attribut_français,
                    frontiere: emission.Nom_frontière_français,
                    tag: emission.Tags_français,
                    unit: emission.Unité_français,
                    location: emission['Sous-localisation_géographique_français'],
                    comment: emission.Commentaire_français,
                    post: emission.Nom_poste_français,
                  },
                  {
                    language: 'en',
                    title: emission.Nom_base_anglais,
                    attribute: emission.Nom_attribut_anglais,
                    frontiere: emission.Nom_frontière_anglais,
                    tag: emission.Tags_anglais,
                    unit: emission.Unité_anglais,
                    location: emission['Sous-localisation_géographique_anglais'],
                    comment: emission.Commentaire_anglais,
                    post: emission.Nom_poste_anglais,
                  },
                ],
              },
            },
          },
        }),
      ),
  )

  return emissions.data.next
}

const main = async () => {
  let url: string | undefined =
    `https://data.ademe.fr/data-fair/api/v1/datasets/base-carboner/lines?select=${select.join(',')}`
  while (url) {
    url = await saveEmissions(url)
  }
}

main()
