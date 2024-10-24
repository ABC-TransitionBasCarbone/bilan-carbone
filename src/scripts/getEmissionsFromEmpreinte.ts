import { prismaClient } from '../db/client'
import { EmissionStatus, Import, Unit } from '@prisma/client'
import { UNITS_MATRIX } from './history_units'
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
    Qualité: number
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
  'Qualité',
  'Qualité_TeR',
  'Qualité_GR',
  'Qualité_TiR',
  'Qualité_C',
]

const validStatus = ['Valide générique', 'Valide spécifique', 'Archivé']

const escapeTranslation = (value?: string) => (value ? value.replaceAll('"""', '') : value)

const getUnit = (value?: string): Unit | null => {
  if (!value) {
    return null
  }
  if (value.startsWith('kgCO2e/')) value = value.replace('kgCO2e/', '')
  if (value.toLowerCase() === 'tep pci') value = 'tep PCI'
  if (value.toLowerCase() === 'tep pcs') value = 'tep PCS'
  if (value.toLowerCase() === 'ha') value = 'ha'
  if (value.toLowerCase() === 'kg') value = 'kg'
  if (value.toLowerCase() === 'litre') value = 'litre'
  if (['kWh (PCI)', 'KWh PCI', 'kWhPCI'].includes(value)) value = 'kWh PCI'
  if (value === 'kWhPCS') value = 'kWh PCS'
  if (value === 'm2 SHON') value = 'm² SHON'
  if (value.includes('m3')) value = value.replace('m3', 'm³')

  const unit = Object.entries(UNITS_MATRIX).find((entry) => entry[1] === value)
  if (unit) return unit[0] as Unit
  throw new Error('Unit not found for ' + value)
}

const saveEmissions = async (url: string, posts: any[]) => {
  const emissions = await axios.get<EmissionResponse>(url)
  await Promise.all(
    emissions.data.results
      .filter((emission) => validStatus.includes(emission["Statut_de_l'élément"]))
      .map((emission) => {
        if (emission.Type_Ligne === 'Poste') {
          posts.push(emission)
          return
        }
        return prismaClient.emission.create({
          data: {
            reliability: 5,
            importedFrom: Import.BaseEmpreinte,
            importedId: emission["Identifiant_de_l'élément"],
            status: emission["Statut_de_l'élément"] === 'Archivé' ? EmissionStatus.Archived : EmissionStatus.Valid,
            source: emission.Source,
            location: emission.Localisation_géographique,
            incertitude: emission.Incertitude,
            technicalRepresentativeness: emission.Qualité_TeR,
            geographicRepresentativeness: emission.Qualité_GR,
            temporalRepresentativeness: emission.Qualité_TiR,
            completeness: emission.Qualité_C,
            totalCo2: emission.Total_poste_non_décomposé,
            co2f: emission.CO2f,
            ch4f: emission.CH4f,
            ch4b: emission.CH4b,
            n2o: emission.N2O,
            co2b: emission.CO2b,
            otherGES: emission.Autres_GES,
            unit: getUnit(emission.Unité_français),
            metaData: {
              createMany: {
                data: [
                  {
                    language: 'fr',
                    title: escapeTranslation(emission.Nom_base_français),
                    attribute: escapeTranslation(emission.Nom_attribut_français),
                    frontiere: escapeTranslation(emission.Nom_frontière_français),
                    tag: escapeTranslation(emission.Tags_français),
                    location: escapeTranslation(emission['Sous-localisation_géographique_français']),
                    comment: escapeTranslation(emission.Commentaire_français),
                  },
                  {
                    language: 'en',
                    title: escapeTranslation(emission.Nom_base_anglais),
                    attribute: escapeTranslation(emission.Nom_attribut_anglais),
                    frontiere: escapeTranslation(emission.Nom_frontière_anglais),
                    tag: escapeTranslation(emission.Tags_anglais),
                    location: escapeTranslation(emission['Sous-localisation_géographique_anglais']),
                    comment: escapeTranslation(emission.Commentaire_anglais),
                  },
                ],
              },
            },
          },
        })
      }),
  )

  return { url: emissions.data.next, posts }
}

const saveEmissionsPosts = async (posts: any[]) => {
  const emissions = await prismaClient.emission.findMany({
    where: {
      importedId: {
        in: posts.map((post) => post["Identifiant_de_l'élément"]),
      },
    },
  })

  await Promise.all(
    posts.map((post) => {
      const emission = emissions.find((emission) => emission.importedId === post["Identifiant_de_l'élément"])
      if (!emission) {
        console.log('No emission found for ' + post["Identifiant_de_l'élément"])
        return Promise.resolve()
      }
      return prismaClient.emissionPost.create({
        data: {
          emissionId: emission.id,
          totalCo2: post.Total_poste_non_décomposé,
          co2f: post.CO2f,
          ch4f: post.CH4f,
          ch4b: post.CH4b,
          n2o: post.N2O,
          co2b: post.CO2b,
          otherGES: post.Autres_GES,
          metaData: {
            createMany: {
              data: [
                {
                  language: 'fr',
                  title: escapeTranslation(post.Nom_base_français),
                  attribute: escapeTranslation(post.Nom_attribut_français),
                  frontiere: escapeTranslation(post.Nom_frontière_français),
                  tag: escapeTranslation(post.Tags_français),
                  location: escapeTranslation(post['Sous-localisation_géographique_français']),
                  comment: escapeTranslation(post.Commentaire_français),
                },
                {
                  language: 'en',
                  title: escapeTranslation(post.Nom_base_anglais),
                  attribute: escapeTranslation(post.Nom_attribut_anglais),
                  frontiere: escapeTranslation(post.Nom_frontière_anglais),
                  tag: escapeTranslation(post.Tags_anglais),
                  location: escapeTranslation(post['Sous-localisation_géographique_anglais']),
                  comment: escapeTranslation(post.Commentaire_anglais),
                },
              ],
            },
          },
        },
      })
    }),
  )
}

const main = async () => {
  await prismaClient.emissionPostMetaData.deleteMany()
  await prismaClient.emissionPost.deleteMany()
  await prismaClient.emissionMetaData.deleteMany()
  await prismaClient.emission.deleteMany()
  let posts = []
  let url: string | undefined =
    `https://data.ademe.fr/data-fair/api/v1/datasets/base-carboner/lines?select=${select.join(',')}`
  while (url) {
    const res = await saveEmissions(url, posts)
    url = res.url
    posts = res.posts
  }
  await saveEmissionsPosts(posts)
}

main()
