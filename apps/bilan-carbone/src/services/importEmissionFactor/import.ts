import { getSourceLatestImportVersionId } from '@/db/study'
import { getEnvVar } from '@/lib/environment'
import { isMonetaryEmissionFactor } from '@/utils/emissionFactors'
import type { Prisma } from '@abc-transitionbascarbone/db-common'
import {
  EmissionFactorPartType,
  EmissionFactorStatus,
  Environment,
  Import,
  SubPost,
  Unit,
} from '@abc-transitionbascarbone/db-common/enums'
import { unitsMatrix } from './historyUnits'
import { additionalParts } from './parts.config'

export const validStatuses = ['Valide générique', 'Valide spécifique', 'Archivé']

export const numberColumns: (keyof ImportEmissionFactor)[] = [
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
  'Valeur_gaz_supplémentaire_1',
  'Valeur_gaz_supplémentaire_2',
]

export const PART_TYPE_LABELS: Record<EmissionFactorPartType, string> = {
  [EmissionFactorPartType.CarburantAmontCombustion]: 'Carburant (amont/combustion)',
  [EmissionFactorPartType.Amont]: 'Amont',
  [EmissionFactorPartType.Intrants]: 'Intrants',
  [EmissionFactorPartType.Combustion]: 'Combustion',
  [EmissionFactorPartType.TransportEtDistribution]: 'Transport et distribution',
  [EmissionFactorPartType.Energie]: 'Energie',
  [EmissionFactorPartType.Fabrication]: 'Fabrication',
  [EmissionFactorPartType.Traitement]: 'Traitement',
  [EmissionFactorPartType.Collecte]: 'Collecte',
  [EmissionFactorPartType.Autre]: 'Autre',
  [EmissionFactorPartType.Amortissement]: 'Amortissement',
  [EmissionFactorPartType.Incineration]: 'Incinération',
  [EmissionFactorPartType.EmissionsFugitives]: 'Emissions fugitives',
  [EmissionFactorPartType.Fuites]: 'Fuites',
  [EmissionFactorPartType.Transport]: 'Transport',
  [EmissionFactorPartType.CombustionALaCentrale]: 'Combustion à la centrale',
  [EmissionFactorPartType.Pertes]: 'Pertes',
  [EmissionFactorPartType.AutresEmissionsLieesALaConsommationDElectriciteBarrage]:
    "Autres émissions liées à la consommation d'électricité (barrage?)",
}

export const UNIT_LABELS: Partial<Record<Unit, string>> = {
  [Unit.KG]: 'kg',
  [Unit.LITER]: 'litre',
  [Unit.HA]: 'ha',
  [Unit.KWH_PCI]: 'kWh PCI',
  [Unit.KWH_PCS]: 'kWh PCS',
  [Unit.M2_SHON]: 'm² SHON',
  [Unit.TEP_PCI]: 'tep PCI',
  [Unit.TEP_PCS]: 'tep PCS',
}

export const unitLabel = (unit: Unit | null | undefined): string => {
  if (!unit) {
    return 'kg'
  }
  return UNIT_LABELS[unit] ?? String(unit)
}

export const statusLabel = (status: EmissionFactorStatus | null | undefined): string => {
  if (!status) {
    return 'Valide générique'
  }
  return status === EmissionFactorStatus.Archived ? 'Archivé' : 'Valide générique'
}

export const getEmissionFactorImportVersion = async (
  transaction: Prisma.TransactionClient,
  name: string,
  source: Import,
) => {
  const existingVersion = await transaction.emissionFactorImportVersion.findFirst({ where: { name, source } })
  if (existingVersion) {
    return { id: existingVersion.id, alreadyExists: true }
  }
  const newVersion = await transaction.emissionFactorImportVersion.create({
    data: { name, source },
  })
  return { id: newVersion.id, alreadyExists: false }
}

export const connectEmissionFactorToVersion = async (
  transaction: Prisma.TransactionClient,
  emissionFactorId: string,
  importVersionId: string,
) => {
  await transaction.emissionFactorVersion.upsert({
    where: { emissionFactorId_importVersionId: { emissionFactorId, importVersionId } },
    create: { emissionFactorId, importVersionId },
    update: {},
  })
}

/**
 * Serializes a CSV row as "header\nvalues" so it can be stored and compared on next imports.
 * The header line ensures comparisons remain correct even if column order changes between versions.
 */
export const serializeRowAsCsv = (row: ImportEmissionFactor): string => {
  const keys = Object.keys(row) as (keyof ImportEmissionFactor)[]
  const header = keys.join(';')
  const values = keys.map((k) => (row[k] !== undefined && row[k] !== null ? String(row[k]) : '')).join(';')
  return `${header}\n${values}`
}

const normalizeValue = (val: string): string => {
  const normalized = val.replace(',', '.')
  const n = Number(normalized)
  if (!isNaN(n) && normalized.trim() !== '') {
    return String(n)
  }
  return val
}

const parseRawCsv = (rawCsv: string): Map<string, string> => {
  const lines = rawCsv.split('\n')
  if (lines.length !== 2) {
    return new Map()
  }
  const headers = lines[0].split(';')
  const values = lines[1].split(';')
  return new Map(headers.map((h, i) => [h, values[i] ?? '']))
}

/**
 * Merges a new CSV row with a previous override delta.
 * Columns that were manually changed (differ between oldImportedRawCsv and overrideRawCsv)
 * are preserved from the override. All other columns come from the new CSV row.
 */
export const mergeRowWithOverride = (
  newRow: ImportEmissionFactor,
  oldImportedRawCsv: string,
  overrideRawCsv: string,
): ImportEmissionFactor => {
  const oldImportedMap = parseRawCsv(oldImportedRawCsv)
  const overrideMap = parseRawCsv(overrideRawCsv)

  const merged = { ...newRow }
  for (const [col, overrideVal] of overrideMap.entries()) {
    const oldVal = oldImportedMap.get(col) ?? ''
    if (normalizeValue(overrideVal) !== normalizeValue(oldVal)) {
      const key = col as keyof ImportEmissionFactor
      if (key in merged) {
        ;(merged[key] as string | number) = numberColumns.includes(key) ? Number(overrideVal) : overrideVal
      }
    }
  }
  return merged
}

export const isRowUnchanged = (existingRawCsv: string, newRow: ImportEmissionFactor): boolean => {
  const newSerialized = serializeRowAsCsv(newRow)
  const existingLines = existingRawCsv.split('\n')
  const newLines = newSerialized.split('\n')
  if (existingLines.length !== 2 || newLines.length !== 2) {
    return false
  }
  const existingHeaders = existingLines[0].split(';')
  const existingValues = existingLines[1].split(';')
  const newHeaders = newLines[0].split(';')
  const newValues = newLines[1].split(';')

  const existingMap = new Map(existingHeaders.map((h, i) => [h, existingValues[i] ?? '']))

  for (let i = 0; i < newHeaders.length; i++) {
    const col = newHeaders[i]
    const existingVal = normalizeValue(existingMap.get(col) ?? '')
    const newVal = normalizeValue(newValues[i] ?? '')
    if (existingVal !== newVal) {
      return false
    }
  }
  return true
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
  reseau?: 'froid' | 'chaud'
}

export const requiredColumns = [
  'Type_Ligne',
  "Identifiant_de_l'élément",
  'Structure',
  "Type_de_l'élément",
  "Statut_de_l'élément",
  'Nom_base_français',
  'Nom_base_anglais',
  'Nom_base_espagnol',
  'Nom_attribut_français',
  'Nom_attribut_anglais',
  'Nom_attribut_espagnol',
  'Nom_frontière_français',
  'Nom_frontière_anglais',
  'Nom_frontière_espagnol',
  'Code_de_la_catégorie',
  'Tags_français',
  'Tags_anglais',
  'Tags_espagnol',
  'Unité_français',
  'Unité_anglais',
  'Unité_espagnol',
  'Contributeur',
  'Autres_Contributeurs',
  'Programme',
  'Url_du_programme',
  'Source',
  'Localisation_géographique',
  'Sous-localisation_géographique_français',
  'Sous-localisation_géographique_anglais',
  'Sous-localisation_géographique_espagnol',
  'Date_de_création',
  'Date_de_modification',
  'Période_de_validité',
  'Incertitude',
  'Réglementations',
  'Transparence',
  'Qualité',
  'Qualité_TeR',
  'Qualité_GR',
  'Qualité_TiR',
  'Qualité_C',
  'Qualité_P',
  'Qualité_M',
  'Commentaire_français',
  'Commentaire_anglais',
  'Commentaire_espagnol',
  'Type_poste',
  'Nom_poste_français',
  'Nom_poste_anglais',
  'Nom_poste_espagnol',
  'Total_poste_non_décomposé',
  'CO2f',
  'CH4f',
  'CH4b',
  'N2O',
  'Code_gaz_supplémentaire_1',
  'Valeur_gaz_supplémentaire_1',
  'Code_gaz_supplémentaire_2',
  'Valeur_gaz_supplémentaire_2',
  'Code_gaz_supplémentaire_3',
  'Valeur_gaz_supplémentaire_3',
  'Code_gaz_supplémentaire_4',
  'Valeur_gaz_supplémentaire_4',
  'Code_gaz_supplémentaire_5',
  'Valeur_gaz_supplémentaire_5',
  'Autres_GES',
  'CO2b',
]

const escapeTranslation = (value?: string) => (value ? String(value).replaceAll('"""', '') : value)

const getUnit = (value?: string): Unit | null => {
  if (!value) {
    value = 'kg'
  }
  if (value.startsWith('kgCO2e/')) {
    value = value.replace('kgCO2e/', '')
  }
  value = value.trim().replace(/\.$/, '').replace("% d'humidité)", '% humidité)').replace('  ', ' ')
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
  } else if (value.includes('kg d?ingrédient ingéré')) {
    value = "kg d'ingrédient ingéré"
  } else if (value.includes('kg de matière seche')) {
    value = 'kg de matière sèche'
  } else if (value.includes("kg d'oeufs") || value.includes("kf d'oeuf")) {
    value = "kg d'oeuf"
  } else if (value.includes('kg fioul / km')) {
    value = 'kg fioul/ km'
  }

  if (!unitsMatrix[value]) {
    throw new Error('Unknown unit : ' + value)
  }

  return unitsMatrix[value]
}

const LABEL_TO_PART_TYPE = Object.fromEntries(
  Object.entries(PART_TYPE_LABELS).map(([type, label]) => [label, type as EmissionFactorPartType]),
) as Record<string, EmissionFactorPartType>

export const getType = (value: string): EmissionFactorPartType => {
  // Special case: CSV uses '?' for accented characters in this label
  const normalized = value.replace('d?électricité', "d'électricité")
  const type = LABEL_TO_PART_TYPE[normalized]
  if (!type) {
    throw new Error(`Emission factor type not found: ${value}`)
  }
  return type
}

export const getEmissionQuality = (uncertainty?: number) => {
  // Si l'incertitude n'est pas defini => Moyenne
  // Si elle est négative ou = 0 => Très bonne
  if (uncertainty === undefined) {
    return 3
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

export const getGases = (emissionFactor: ImportEmissionFactor) => {
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
  getSubPost: (emissionFactor: ImportEmissionFactor) => SubPost[],
) => ({
  ...getGases(emissionFactor),
  reliability: 5,
  importedFrom,
  importedId: emissionFactor["Identifiant_de_l'élément"],
  status:
    emissionFactor["Statut_de_l'élément"] === 'Archivé' ? EmissionFactorStatus.Archived : EmissionFactorStatus.Valid,
  source: emissionFactor.Source,
  location: emissionFactor.Localisation_géographique,
  technicalRepresentativeness: emissionFactor.Qualité_TeR || getEmissionQuality(emissionFactor.Incertitude),
  geographicRepresentativeness: emissionFactor.Qualité_GR || getEmissionQuality(emissionFactor.Incertitude),
  temporalRepresentativeness: emissionFactor.Qualité_TiR || getEmissionQuality(emissionFactor.Incertitude),
  completeness: emissionFactor.Qualité_C || getEmissionQuality(emissionFactor.Incertitude),
  unit: getUnit(emissionFactor.Unité_français),
  isMonetary: isMonetaryEmissionFactor({
    unit: getUnit(emissionFactor.Unité_français),
  }),
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
})

export const saveEmissionFactorsParts = async (
  transaction: Prisma.TransactionClient,
  importedIdToEfId: Map<string, string>,
  parts: ImportEmissionFactor[],
  reusedEfIds: Set<string> = new Set(),
) => {
  for (const [i, part] of parts.entries()) {
    if (i % 100 === 0) {
      console.log(`${i}/${parts.length}`)
    }
    const emissionFactorId = importedIdToEfId.get(part["Identifiant_de_l'élément"])
    if (!emissionFactorId) {
      throw new Error('No emission factor found for ' + part["Identifiant_de_l'élément"])
    }
    if (reusedEfIds.has(emissionFactorId)) {
      continue
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
      emissionFactor: { connect: { id: emissionFactorId } },
      type: getType(part.Type_poste),
      importedRawCsv: serializeRowAsCsv(part),
      metaData: metaData.length > 0 ? { createMany: { data: metaData } } : undefined,
    } satisfies Prisma.EmissionFactorPartCreateInput

    await transaction.emissionFactorPart.create({ data })
  }
}

export const propagatePartOverrides = async (
  transaction: Prisma.TransactionClient,
  mergedOverrideEfIds: Map<string, string>,
) => {
  if (mergedOverrideEfIds.size === 0) {
    return
  }

  const oldEfIds = [...mergedOverrideEfIds.values()]
  const oldParts = await transaction.emissionFactorPart.findMany({
    where: { emissionFactorId: { in: oldEfIds }, overrideRawCsv: { not: null } },
    select: { emissionFactorId: true, type: true, importedRawCsv: true, overrideRawCsv: true },
  })

  for (const [newEfId, oldEfId] of mergedOverrideEfIds.entries()) {
    const oldPartsForEf = oldParts.filter((p) => p.emissionFactorId === oldEfId)
    if (oldPartsForEf.length === 0) {
      continue
    }

    const newParts = await transaction.emissionFactorPart.findMany({
      where: { emissionFactorId: newEfId },
      select: { id: true, type: true, importedRawCsv: true },
    })

    for (const oldPart of oldPartsForEf) {
      if (!oldPart.importedRawCsv || !oldPart.overrideRawCsv) {
        continue
      }
      const newPart = newParts.find((p) => p.type === oldPart.type)
      if (!newPart?.importedRawCsv) {
        continue
      }

      const oldImportedMap = parseRawCsv(oldPart.importedRawCsv)
      const overrideMap = parseRawCsv(oldPart.overrideRawCsv)

      const gasFields: (keyof ImportEmissionFactor)[] = [
        'Total_poste_non_décomposé',
        'CO2f',
        'CH4f',
        'CH4b',
        'N2O',
        'CO2b',
        'Autres_GES',
      ]
      const updateData: Record<string, number | string> = {}
      // Columns that were manually changed on the old part (delta)
      const deltaColumns = new Map<string, string>()

      for (const [col, overrideVal] of overrideMap.entries()) {
        const oldVal = oldImportedMap.get(col) ?? ''
        if (normalizeValue(overrideVal) !== normalizeValue(oldVal)) {
          deltaColumns.set(col, overrideVal)
          if (gasFields.includes(col as keyof ImportEmissionFactor)) {
            const prismaField = csvColToPrismaGasField(col)
            if (prismaField) {
              updateData[prismaField] = Number(overrideVal)
            }
          }
        }
      }

      if (Object.keys(updateData).length > 0) {
        // Build overrideRawCsv relative to the new part's importedRawCsv so future
        // imports compute the delta correctly.
        const newImportedMap = parseRawCsv(newPart.importedRawCsv)
        for (const [col, overrideVal] of deltaColumns) {
          newImportedMap.set(col, overrideVal)
        }
        const headers = [...newImportedMap.keys()].join(';')
        const values = [...newImportedMap.values()].join(';')
        const newOverrideRawCsv = `${headers}\n${values}`

        await transaction.emissionFactorPart.update({
          where: { id: newPart.id },
          data: { ...updateData, overrideRawCsv: newOverrideRawCsv },
        })
      }
    }
  }
}

const csvColToPrismaGasField = (col: string): string | null => {
  const map: Record<string, string> = {
    Total_poste_non_décomposé: 'totalCo2',
    CO2f: 'co2f',
    CH4f: 'ch4f',
    CH4b: 'ch4b',
    N2O: 'n2o',
    CO2b: 'co2b',
    Autres_GES: 'otherGES',
  }
  return map[col] ?? null
}

export const cleanImport = async (transaction: Prisma.TransactionClient, newEmissionFactorIds: string[]) => {
  console.log('Clean emission factors sums')
  const emissionFactors = await transaction.emissionFactor.findMany({
    where: { id: { in: newEmissionFactorIds } },
    include: { emissionFactorParts: true },
  })

  let i = 0
  for (const emissionFactor of emissionFactors) {
    if (Number(i) % 500 === 0) {
      console.log(`Emission factor: ${i}/${emissionFactors.length}`)
    }

    i++
    if (emissionFactor.importedId) {
      const additionalPart = additionalParts[emissionFactor.importedId]
      if (additionalPart) {
        await transaction.emissionFactorPart.create({
          data: {
            emissionFactor: { connect: { id: emissionFactor.id } },
            type: additionalPart,
            co2f: emissionFactor.co2f,
            ch4f: emissionFactor.ch4f,
            ch4b: emissionFactor.ch4b,
            n2o: emissionFactor.n2o,
            co2b: emissionFactor.co2b,
            sf6: emissionFactor.sf6,
            hfc: emissionFactor.hfc,
            pfc: emissionFactor.pfc,
            otherGES: emissionFactor.otherGES,
            totalCo2: emissionFactor.totalCo2,
          },
        })
      }
    }

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

export const addSourceToStudies = async (source: Import, transaction: Prisma.TransactionClient) => {
  const [studies, importVersion] = await Promise.all([
    transaction.study.findMany({
      select: {
        id: true,
        createdBy: {
          select: { environment: true },
        },
      },
    }),
    getSourceLatestImportVersionId(source, transaction),
  ])

  if (studies.length && !!importVersion) {
    const filteredStudiesPromises = studies.map(async (study) => {
      const environment = study.createdBy.environment
      const sourcesForEnv = await isSourceForEnv(environment)
      return sourcesForEnv.includes(source) ? study : null
    })
    const filteredStudiesResults = await Promise.all(filteredStudiesPromises)
    const filteredStudies = filteredStudiesResults.filter((study) => study !== null)

    if (filteredStudies.length > 0) {
      await transaction.studyEmissionFactorVersion.createMany({
        data: filteredStudies.map((study) => ({ studyId: study.id, source, importVersionId: importVersion.id })),
        skipDuplicates: true,
      })
    }
  }
}

export const isSourceForEnv = async (env: Environment): Promise<Import[]> => {
  const envVar = await getEnvVar('FE_SOURCES_IMPORT', env)

  if (!envVar) {
    return []
  }
  return envVar
    .split(',')
    .map((name) => {
      const key = name.trim() as keyof typeof Import
      return Import[key]
    })
    .filter((v): v is Import => !!v)
}
