import { prismaClient } from '../db/client'
import { EmissionStatus, Import, PostType, Unit } from '@prisma/client'
import { UNITS_MATRIX, POST_TYPE_MATRIX } from './history_units'
import axios, { AxiosResponse } from 'axios'

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
    Code_gaz_supplémentaire_1: string
    Valeur_gaz_supplémentaire_1: number
    Code_gaz_supplémentaire_2: string
    Valeur_gaz_supplémentaire_2: number
  }[]
}

type EmissionPostDataType = {
  emissionId: string
  totalCo2: number
  co2f: number
  ch4f: number
  ch4b: number
  n2o: number
  co2b: number
  sf6: number
  hfc: number
  pfc: number
  otherGES: number
  type: PostType
  metaData?: {
    createMany: {
      data: { title: string; language: string }[]
    }
  }
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
  'Code_gaz_supplémentaire_1',
  'Valeur_gaz_supplémentaire_1',
  'Code_gaz_supplémentaire_2',
  'Valeur_gaz_supplémentaire_2',
]

const validStatus = ['Valide générique', 'Valide spécifique', 'Archivé']

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

  const unit = Object.entries(UNITS_MATRIX).find((entry) => entry[1] === value)
  if (unit) {
    return unit[0] as Unit
  }
  return null
}

const getPostType = (value: string): PostType => {
  const postType = Object.entries(POST_TYPE_MATRIX).find((entry) => entry[1] === value)
  if (postType) {
    return postType[0] as PostType
  }

  throw new Error(`Unknown post type: ${value}`)
}

const saveEmissions = async (emissions: EmissionResponse['results']) =>
  Promise.all(
    emissions.map((emission) => {
      const data = {
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
        sf6: 0,
        hfc: 0,
        pfc: 0,
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
      }
      if (emission.Valeur_gaz_supplémentaire_1) {
        if (emission.Code_gaz_supplémentaire_1 === 'Divers') {
          data.otherGES = emission.Valeur_gaz_supplémentaire_1 + data.otherGES
        }
        if (emission.Code_gaz_supplémentaire_1 === 'SF6') {
          data.sf6 = emission.Valeur_gaz_supplémentaire_1
        }
      }
      if (emission.Valeur_gaz_supplémentaire_2) {
        if (emission.Code_gaz_supplémentaire_2 === 'Divers') {
          data.otherGES = emission.Valeur_gaz_supplémentaire_2 + data.otherGES
        }
        if (emission.Code_gaz_supplémentaire_2 === 'SF6') {
          data.sf6 = emission.Valeur_gaz_supplémentaire_2
        }
      }
      return prismaClient.emission.create({ data })
    }),
  )

const saveEmissionsPosts = async (posts: EmissionResponse['results']) => {
  const emissions = await prismaClient.emission.findMany({
    where: {
      importedId: {
        in: posts.map((post) => post["Identifiant_de_l'élément"]),
      },
    },
  })

  for (const i in posts) {
    if (Number(i) % 10 === 0) {
      console.log(`Save post: ${i}/${posts.length}`)
    }
    const post = posts[i]
    const emission = emissions.find((emission) => emission.importedId === post["Identifiant_de_l'élément"])
    if (!emission) {
      console.error('No emission found for ' + post["Identifiant_de_l'élément"])
      throw new Error('No emission found for ' + post["Identifiant_de_l'élément"])
    }

    const metaData = []
    if (post.Nom_poste_français) {
      metaData.push({ title: post.Nom_poste_français, language: 'fr' })
    }
    if (post.Nom_poste_anglais) {
      metaData.push({ title: post.Nom_poste_anglais, language: 'en' })
    }

    const data: EmissionPostDataType = {
      emissionId: emission.id,
      totalCo2: post.Total_poste_non_décomposé,
      co2f: post.CO2f,
      ch4f: post.CH4f,
      ch4b: post.CH4b,
      n2o: post.N2O,
      co2b: post.CO2b,
      sf6: 0,
      hfc: 0,
      pfc: 0,
      otherGES: post.Autres_GES,
      type: getPostType(post.Type_poste),
      metaData:
        metaData.length > 0
          ? {
              createMany: {
                data: metaData,
              },
            }
          : undefined,
    }
    if (!post.Nom_poste_français && !post.Nom_poste_anglais) {
      delete data.metaData
    }
    if (post.Valeur_gaz_supplémentaire_1) {
      const type = post.Code_gaz_supplémentaire_1 || (emission.sf6 ? 'SF6' : 'Divers')
      if (type === 'Divers') {
        data.otherGES = post.Valeur_gaz_supplémentaire_1 + data.otherGES
      }
      if (type === 'SF6') {
        data.sf6 = post.Valeur_gaz_supplémentaire_1
      }
    }
    if (post.Valeur_gaz_supplémentaire_2) {
      const type = post.Code_gaz_supplémentaire_2 || (emission.sf6 ? 'SF6' : 'Divers')
      if (type === 'Divers') {
        data.otherGES = post.Valeur_gaz_supplémentaire_2 + data.otherGES
      }
      if (type === 'SF6') {
        data.sf6 = post.Valeur_gaz_supplémentaire_2
      }
    }
    await prismaClient.emissionPost.create({ data })
  }
}

const main = async () => {
  await Promise.all([prismaClient.emissionPostMetaData.deleteMany(), prismaClient.emissionMetaData.deleteMany()])
  await prismaClient.emissionPost.deleteMany()
  await prismaClient.emission.deleteMany()

  let posts: EmissionResponse['results'] = []
  let url: string | undefined =
    `https://data.ademe.fr/data-fair/api/v1/datasets/base-carboner/lines?select=${select.join(',')}`
  while (url) {
    console.log(url)
    const emissions: AxiosResponse<EmissionResponse> = await axios.get<EmissionResponse>(url)
    const validEmissions = emissions.data.results.filter((emission) =>
      validStatus.includes(emission["Statut_de_l'élément"]),
    )
    posts = posts.concat(validEmissions.filter((emission) => emission.Type_Ligne === 'Poste'))
    await saveEmissions(validEmissions.filter((emission) => emission.Type_Ligne !== 'Poste'))

    url = emissions.data.next
  }

  await saveEmissionsPosts(posts)
}

main()
