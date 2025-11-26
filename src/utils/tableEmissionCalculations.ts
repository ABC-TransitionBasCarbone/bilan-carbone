import { TableAnswer, TableRow } from '@/components/dynamic-form/types/formTypes'
import { emissionFactorMap } from '@/constants/emissionFactorMap'
import { SPECTATOR_SHORT_DISTANCE_DETAILS_QUESTION_ID } from '@/constants/questions'
import { getEmissionFactorByImportedIdAndStudiesEmissionSource } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { Question } from '@prisma/client'

const MEAL_EMISSION_FACTOR_ID = '20682'
const MONTHS_PER_YEAR = 12
const WEEKS_PER_YEAR = 52
const WORKING_WEEKS_PER_YEAR = WEEKS_PER_YEAR - 5
const MEALS_PER_DAY = 2
const WASTE_DENSITY = 0.3 // kg/L

export interface EmissionSourceCalculation {
  name: string
  value: number
  emissionFactorId?: string
}

export interface TableEmissionCalculationResult {
  emissionSources: EmissionSourceCalculation[]
}

export interface TableEmissionCalculator {
  calculate: (row: TableRow, study: FullStudy) => Promise<TableEmissionCalculationResult>
}

/**
 * Calculator for question: 10-Quel est le rythme de travail des collaborateurs du cinéma?
 * Formula:
 * - Meal value: days_per_week * WEEKS_PER_YEAR
 * - Transport value: distance_km * days_per_week * WEEKS_PER_YEAR
 */
const calculateWorkRhythm: TableEmissionCalculator = {
  calculate: async (row, study) => {
    const daysPerWeek = parseFloat(row.data['12-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema'] || '0')
    const distanceKm = parseFloat(row.data['13-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema'] || '0')
    const transportModeFEList =
      emissionFactorMap['14-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema'].emissionFactors
    const transportModeFEName = row.data['15-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema'] || ''

    const emissionSources: EmissionSourceCalculation[] = []

    if (daysPerWeek > 0 && MEAL_EMISSION_FACTOR_ID) {
      const mealEmissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
        MEAL_EMISSION_FACTOR_ID,
        study.emissionFactorVersions.map((v) => v.importVersionId),
      )

      if (mealEmissionFactor) {
        const mealValue = daysPerWeek * WORKING_WEEKS_PER_YEAR
        emissionSources.push({
          name: 'meal',
          value: mealValue,
          emissionFactorId: mealEmissionFactor.id,
        })
      }
    }

    const transportEmissionFactorId = transportModeFEList?.[transportModeFEName]

    if (daysPerWeek > 0 && distanceKm > 0 && transportEmissionFactorId) {
      const transportEmissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
        transportEmissionFactorId,
        study.emissionFactorVersions.map((v) => v.importVersionId),
      )

      if (transportEmissionFactor) {
        const transportValue = distanceKm * daysPerWeek * WORKING_WEEKS_PER_YEAR
        emissionSources.push({
          name: 'transport',
          value: transportValue, // Raw value: total km per year
          emissionFactorId: transportEmissionFactor.id,
        })
      }
    }

    return {
      emissionSources,
    }
  },
}

/**
 * Calculator for question: 10-Décrivez les déplacements professionnels de vos collaborateurs
 * Formula:
 * - Transport value: distance_km * participants * occurrences
 * - Accommodation value: accommodation_type * duration_days * participants * occurrences
 * - Meal value: duration_days * participants * occurrences * MEALS_PER_DAY
 */
const calculateProfessionalTravel: TableEmissionCalculator = {
  calculate: async (row, study) => {
    const distance = parseFloat(row.data['12-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'] || '0')
    const participants = parseFloat(
      row.data['13-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'] || '0',
    )
    const transportModeFEList =
      emissionFactorMap['14-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'].emissionFactors
    const transportModeFEName = row.data['14-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'] || ''
    const occurrences = parseFloat(row.data['15-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'] || '0')
    const accommodationTypeFEList =
      emissionFactorMap['16-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'].emissionFactors
    const accommodationTypeFEName = row.data['16-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'] || ''
    const duration = parseFloat(row.data['17-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'] || '0')

    if (!participants || participants <= 0 || !occurrences || occurrences <= 0) {
      return {
        emissionSources: [],
      }
    }

    const emissionSources: EmissionSourceCalculation[] = []

    if (transportModeFEName && transportModeFEList && distance && distance > 0) {
      const transportModeFE = transportModeFEList[transportModeFEName]

      if (transportModeFE) {
        const transportEmissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
          transportModeFE,
          study.emissionFactorVersions.map((v) => v.importVersionId),
        )

        if (transportEmissionFactor) {
          const transportValue = distance * participants * occurrences
          emissionSources.push({
            name: 'transport',
            value: transportValue,
            emissionFactorId: transportEmissionFactor.id,
          })
        }
      }
    }

    if (accommodationTypeFEName && accommodationTypeFEList && duration > 0) {
      const accommodationTypeFE = accommodationTypeFEList[accommodationTypeFEName]

      if (accommodationTypeFE) {
        const accommodationEmissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
          accommodationTypeFE,
          study.emissionFactorVersions.map((v) => v.importVersionId),
        )

        if (accommodationEmissionFactor) {
          const accommodationValue = duration * participants * occurrences
          emissionSources.push({
            name: 'accommodation',
            value: accommodationValue,
            emissionFactorId: accommodationEmissionFactor.id,
          })
        }
      }
    }

    if (duration > 0) {
      const mealEmissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
        MEAL_EMISSION_FACTOR_ID,
        study.emissionFactorVersions.map((v) => v.importVersionId),
      )

      if (mealEmissionFactor) {
        const mealValue = duration * participants * occurrences * MEALS_PER_DAY
        emissionSources.push({
          name: 'meals',
          value: mealValue,
          emissionFactorId: mealEmissionFactor.id,
        })
      }
    }

    return {
      emissionSources,
    }
  },
}

const calculateEmissionSourcesDepreciation = async (
  study: FullStudy,
  questionIdIntern: string,
  name: string,
  equipmentType: string,
  quantity: number,
  purchaseYear: number,
): Promise<TableEmissionCalculationResult> => {
  if (!equipmentType || !purchaseYear) {
    return {
      emissionSources: [],
    }
  }

  const emissionSources: EmissionSourceCalculation[] = []
  const emissionFactorInfo = emissionFactorMap[questionIdIntern]
  const emissionFactorId = emissionFactorInfo?.emissionFactors?.[equipmentType]
  const depreciationPeriod = emissionFactorInfo?.depreciationPeriod

  if (!emissionFactorId || !depreciationPeriod) {
    return {
      emissionSources: [],
    }
  }

  if (emissionFactorId) {
    const emissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
      emissionFactorId,
      study.emissionFactorVersions.map((v) => v.importVersionId),
    )

    if (emissionFactor) {
      const currentYear = study.startDate.getFullYear()

      if (purchaseYear > currentYear) {
        return {
          emissionSources: [],
        }
      }

      const yearCount = currentYear - purchaseYear

      // Calculate depreciation factor
      // Year 1 - 5 : 1/5; Year 6+: 0 because already depreciated
      let depreciationFactor = 0
      if (yearCount < depreciationPeriod) {
        depreciationFactor = 1 / depreciationPeriod
      }

      const finalValue = quantity * depreciationFactor

      emissionSources.push({
        name,
        value: finalValue,
        emissionFactorId: emissionFactor.id,
      })
    }
  }

  return {
    emissionSources,
  }
}

/**
 * Calculator for question: 10-Pour chacun de ces équipements électroménagers, veuillez renseigner
 * Formula:
 * - Equipment value: quantity * depreciation_factor (based on purchase year and depreciation period)
 * - Uses standard depreciation calculation over 5 years
 */
const calculateElectromenager: TableEmissionCalculator = {
  calculate: async (row, study) => {
    const equipmentType = row.data['11-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner'] || ''
    const quantity = parseInt(row.data['12-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner'] || '0')
    const purchaseYear = parseInt(
      row.data['13-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner'] || '0',
    )
    const rentedDays = parseInt(
      row.data['14-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner'] || '0',
    )

    if (purchaseYear) {
      return calculateEmissionSourcesDepreciation(
        study,
        '10-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner',
        'electromenager',
        equipmentType,
        quantity,
        purchaseYear,
      )
    }

    return calculateEmissionSourcesDepreciation(
      study,
      '10-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner',
      'electromenager-location',
      equipmentType,
      (quantity * rentedDays) / 365,
      study.startDate.getFullYear(),
    )
  },
}

/**
 * Calculator for question: 10-Pour chacun de ces équipements informatiques, veuillez indiquer
 * Formula:
 * - Equipment value: quantity * depreciation_factor (based on purchase year and depreciation period)
 * - Uses standard depreciation calculation over 4 years
 */
const calculateInformatique: TableEmissionCalculator = {
  calculate: async (row, study) => {
    const equipmentType = row.data['11-pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer'] || ''
    const purchaseYear = parseInt(row.data['12-pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer'] || '0')
    const rentedDays = parseInt(row.data['14-pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer'] || '0')
    const quantity = parseInt(row.data['13-pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer'] || '0')

    if (purchaseYear) {
      return calculateEmissionSourcesDepreciation(
        study,
        '10-pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer',
        'informatique',
        equipmentType,
        quantity,
        purchaseYear,
      )
    }

    return calculateEmissionSourcesDepreciation(
      study,
      '10-pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer',
      'informatique-location',
      equipmentType,
      (quantity * rentedDays) / 365,
      study.startDate.getFullYear(),
    )
  },
}

/**
 * Calculator for question: 10-Quelles sont les distances parcourues au total sur l'année pour chacun des modes de transport suivants?
 * Formula:
 * - Transport value: distance_km (already annual total, no time conversion needed)
 */
const calculateSpectatorMobility: TableEmissionCalculator = {
  calculate: async (row, study) => {
    const transportModeFEName =
      row.data[
        '11-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants'
      ] || ''
    const distanceKm = parseFloat(
      row.data[
        '12-quelles-sont-les-distances-parcourues-au-total-sur-lannee-pour-chacun-des-modes-de-transport-suivants'
      ] || '0',
    )
    const transportModeFEList = emissionFactorMap[SPECTATOR_SHORT_DISTANCE_DETAILS_QUESTION_ID].emissionFactors

    if (!transportModeFEName || !distanceKm || distanceKm <= 0) {
      return {
        emissionSources: [],
      }
    }

    const emissionSources: EmissionSourceCalculation[] = []
    const transportEmissionFactorId = transportModeFEList?.[transportModeFEName]

    if (transportEmissionFactorId) {
      const transportEmissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
        transportEmissionFactorId,
        study.emissionFactorVersions.map((v) => v.importVersionId),
      )

      if (transportEmissionFactor) {
        emissionSources.push({
          name: 'transport',
          value: distanceKm, // Raw value: total km per year
          emissionFactorId: transportEmissionFactor.id,
        })
      }
    }

    return {
      emissionSources,
    }
  },
}

/**
 * Calculator for question: 10-Quelle quantité de matériel produisez-vous chaque mois?
 * Formula:
 * - Material value: quantity * material_weight * MONTHS_PER_YEAR (12)
 * - Converts monthly production to annual weight in kg
 */
const calculateMaterials: TableEmissionCalculator = {
  calculate: async (row, study) => {
    const typeMaterial = row.data['11-quelle-quantite-de-materiel-produisez-vous-chaque-mois'] || ''
    const quantityMaterial = parseFloat(row.data['12-quelle-quantite-de-materiel-produisez-vous-chaque-mois'] || '0')

    if (!typeMaterial || !quantityMaterial || quantityMaterial <= 0) {
      return { emissionSources: [] }
    }

    const emissionFactorInfo = emissionFactorMap['10-quelle-quantite-de-materiel-produisez-vous-chaque-mois']
    const materialFeId = emissionFactorInfo.emissionFactors?.[typeMaterial]
    const materialWeight = emissionFactorInfo.weights?.[typeMaterial] || 1 // Default to 1 if no weight specified
    const emissionSources: EmissionSourceCalculation[] = []

    if (materialFeId) {
      const materialEmissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
        materialFeId,
        study.emissionFactorVersions.map((v) => v.importVersionId),
      )

      if (materialEmissionFactor) {
        const value = quantityMaterial * materialWeight * MONTHS_PER_YEAR
        emissionSources.push({
          name: `material - ${typeMaterial}`,
          value: value,
          emissionFactorId: materialEmissionFactor.id,
        })
      }
    }

    return {
      emissionSources,
    }
  },
}

/**
 * Calculator for question: 10-Quelle quantité de matériel distributeurs recevez-vous en moyenne par semaine?
 * Formula:
 * - Material value: quantity * material_weight * WEEKS_PER_YEAR (52)
 * - Converts weekly reception to annual weight in kg
 */
const calculateDistributorMaterials: TableEmissionCalculator = {
  calculate: async (row, study) => {
    const typeMaterial =
      row.data['11-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine'] || ''
    const quantityMaterial = parseFloat(
      row.data['12-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine'] || '0',
    )

    if (!typeMaterial || !quantityMaterial || quantityMaterial <= 0) {
      return { emissionSources: [] }
    }

    const emissionFactorInfo =
      emissionFactorMap['10-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine']
    const materialFeId = emissionFactorInfo.emissionFactors?.[typeMaterial]
    const materialWeight = emissionFactorInfo.weights?.[typeMaterial] || 1
    const emissionSources: EmissionSourceCalculation[] = []

    if (materialFeId) {
      const materialEmissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
        materialFeId,
        study.emissionFactorVersions.map((v) => v.importVersionId),
      )

      if (materialEmissionFactor) {
        const value = quantityMaterial * materialWeight * WEEKS_PER_YEAR
        emissionSources.push({
          name: `distributor material week - ${typeMaterial}`,
          value: value,
          emissionFactorId: materialEmissionFactor.id,
        })
      }
    }

    return {
      emissionSources,
    }
  },
}

/**
 * Calculator for question: 10-Quelle quantité de matériel distributeurs recevez-vous en moyenne par mois?
 * Formula:
 * - Material value: quantity * material_weight * MONTHS_PER_YEAR (12)
 * - Converts monthly reception to annual weight in kg
 */
const calculateDistributorMaterialsByMonth: TableEmissionCalculator = {
  calculate: async (row, study) => {
    const typeMaterial = row.data['11-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-mois'] || ''
    const quantityMaterial = parseFloat(
      row.data['12-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-mois'] || '0',
    )

    if (!typeMaterial || !quantityMaterial || quantityMaterial <= 0) {
      return { emissionSources: [] }
    }

    const emissionFactorInfo =
      emissionFactorMap['10-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-mois']
    const materialFeId = emissionFactorInfo.emissionFactors?.[typeMaterial]
    const materialWeight = emissionFactorInfo.weights?.[typeMaterial] || 1
    const emissionSources: EmissionSourceCalculation[] = []

    if (materialFeId) {
      const materialEmissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
        materialFeId,
        study.emissionFactorVersions.map((v) => v.importVersionId),
      )

      if (materialEmissionFactor) {
        const value = quantityMaterial * materialWeight * MONTHS_PER_YEAR
        emissionSources.push({
          name: `distributor material month - ${typeMaterial}`,
          value: value,
          emissionFactorId: materialEmissionFactor.id,
        })
      }
    }

    return {
      emissionSources,
    }
  },
}

/**
 * Calculator for question: 10-Décrivez les différentes salles du cinéma
 * Formula:
 * - Projector: quantity (1) * depreciation_factor (based on purchase year and 10-year period)
 * - Screen: screen_size * depreciation_factor (based on purchase year and 10-year period)
 * - Seats: seat_count * depreciation_factor (based on purchase year and 10-year period)
 * - Sound system: quantity (1) * depreciation_factor (based on purchase year and 10-year period)
 */
const calculateRooms: TableEmissionCalculator = {
  calculate: async (row, study) => {
    const projectorType = row.data['102-decrivez-les-differentes-salles-du-cinema'] || ''
    const projectorYear = parseInt(row.data['103-decrivez-les-differentes-salles-du-cinema'] || '0')
    const screenType = row.data['104-decrivez-les-differentes-salles-du-cinema'] || ''
    const screenSize = parseFloat(row.data['105-decrivez-les-differentes-salles-du-cinema'] || '0')
    const screenYear = parseInt(row.data['106-decrivez-les-differentes-salles-du-cinema'] || '0')
    const seatType = row.data['107-decrivez-les-differentes-salles-du-cinema'] || ''
    const seatCount = parseFloat(row.data['108-decrivez-les-differentes-salles-du-cinema'] || '0')
    const seatYear = parseInt(row.data['109-decrivez-les-differentes-salles-du-cinema'] || '0')
    const soundType = row.data['110-decrivez-les-differentes-salles-du-cinema'] || ''
    const soundYear = parseInt(row.data['111-decrivez-les-differentes-salles-du-cinema'] || '0')

    let allEmissionSources: EmissionSourceCalculation[] = []

    if (projectorType && projectorYear) {
      const projectorResult = await calculateEmissionSourcesDepreciation(
        study,
        '102-decrivez-les-differentes-salles-du-cinema',
        'projector',
        projectorType,
        1,
        projectorYear,
      )
      allEmissionSources = allEmissionSources.concat(projectorResult.emissionSources)
    }

    if (screenType && screenSize > 0 && screenYear) {
      const screenResult = await calculateEmissionSourcesDepreciation(
        study,
        '104-decrivez-les-differentes-salles-du-cinema',
        'screen',
        screenType,
        screenSize,
        screenYear,
      )
      allEmissionSources = allEmissionSources.concat(screenResult.emissionSources)
    }

    if (seatType && seatCount > 0 && seatYear) {
      const seatResult = await calculateEmissionSourcesDepreciation(
        study,
        '107-decrivez-les-differentes-salles-du-cinema',
        'seat',
        seatType,
        seatCount,
        seatYear,
      )
      allEmissionSources = allEmissionSources.concat(seatResult.emissionSources)
    }

    // Système de son
    if (soundType && soundYear) {
      const soundResult = await calculateEmissionSourcesDepreciation(
        study,
        '110-decrivez-les-differentes-salles-du-cinema',
        'sound',
        soundType,
        1,
        soundYear,
      )
      allEmissionSources = allEmissionSources.concat(soundResult.emissionSources)
    }

    return {
      emissionSources: allEmissionSources,
    }
  },
}

/**
 * Calculator for question: 10-Veuillez renseigner les déchets générés par semaine
 * Formula:
 * - Waste value: bin_count * bin_size_liters * WASTE_DENSITY * frequency_per_week * WEEKS_PER_YEAR (52)
 * - Converts weekly waste generation to annual weight in kg
 */
const calculateWaste: TableEmissionCalculator = {
  calculate: async (row, study) => {
    const wasteType = row.data['11-veuillez-renseigner-les-dechets-generes-par-semaine'] || ''
    const binCount = parseFloat(row.data['12-veuillez-renseigner-les-dechets-generes-par-semaine'] || '0')
    const binSize = parseFloat(row.data['13-veuillez-renseigner-les-dechets-generes-par-semaine'] || '0')
    const frequency = parseFloat(row.data['14-veuillez-renseigner-les-dechets-generes-par-semaine'] || '0')

    if (!wasteType || binCount <= 0 || binSize <= 0 || frequency <= 0) {
      return {
        emissionSources: [],
      }
    }
    const emissionSources: EmissionSourceCalculation[] = []
    const wasteFEList = emissionFactorMap['10-veuillez-renseigner-les-dechets-generes-par-semaine'].emissionFactors
    const wasteEmissionFactorId = wasteFEList?.[wasteType]

    if (wasteEmissionFactorId) {
      const wasteEmissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
        wasteEmissionFactorId,
        study.emissionFactorVersions.map((v) => v.importVersionId),
      )

      if (wasteEmissionFactor) {
        const wasteValue =
          binCount * binSize * (wasteEmissionFactorId === '34478' ? 0.04 : WASTE_DENSITY) * frequency * 52 * 0.001
        emissionSources.push({
          name: 'waste',
          value: wasteValue,
          emissionFactorId: wasteEmissionFactor.id,
        })
      }
    }

    return {
      emissionSources,
    }
  },
}

const tableEmissionCalculators: Record<string, TableEmissionCalculator> = {
  '10-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': calculateWorkRhythm,
  '10-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': calculateProfessionalTravel,
  '10-pour-chacun-de-ces-equipements-electromenagers-veuillez-renseigner': calculateElectromenager,
  '10-pour-chacun-de-ces-equipements-informatiques-veuillez-indiquer': calculateInformatique,
  [SPECTATOR_SHORT_DISTANCE_DETAILS_QUESTION_ID]: calculateSpectatorMobility,
  '10-quelle-quantite-de-materiel-produisez-vous-chaque-mois': calculateMaterials,
  '10-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-semaine': calculateDistributorMaterials,
  '10-quelle-quantite-de-materiel-distributeurs-recevez-vous-en-moyenne-par-mois': calculateDistributorMaterialsByMonth,
  '10-decrivez-les-differentes-salles-du-cinema': calculateRooms,
  '10-veuillez-renseigner-les-dechets-generes-par-semaine': calculateWaste,
}

export const hasTableEmissionCalculator = (questionIdIntern: string): boolean => {
  return questionIdIntern in tableEmissionCalculators
}

export const calculateTableEmissions = async (
  question: Question,
  tableAnswer: TableAnswer,
  study: FullStudy,
): Promise<TableEmissionCalculationResult[]> => {
  const calculator = tableEmissionCalculators[question.idIntern]

  if (!calculator) {
    return []
  }

  const results: TableEmissionCalculationResult[] = []

  for (const row of tableAnswer.rows) {
    const result = await calculator.calculate(row, study)
    results.push(result)
  }

  return results
}
