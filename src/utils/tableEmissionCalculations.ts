import { TableAnswer, TableRow } from '@/components/dynamic-form/types/formTypes'
import { getEmissionFactorByImportedIdAndStudiesEmissionSource } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { Question } from '@prisma/client'

/**
 * Interface for individual emission source calculations
 */
export interface EmissionSourceCalculation {
  name: string
  value: number
  emissionFactorId?: string
}

/**
 * Interface for table emission calculation results per row
 */
export interface TableEmissionCalculationResult {
  emissionSources: EmissionSourceCalculation[]
}

/**
 * Interface for table emission calculators
 */
export interface TableEmissionCalculator {
  calculate: (row: TableRow, study: FullStudy) => Promise<TableEmissionCalculationResult>
}

const MEAL_EMISSION_FACTOR_ID = '20682'
const WEEKS_PER_YEAR = 47 // 52 weeks - 5 weeks of holidays
const MEALS_PER_DAY = 2

/**
 * Calculator for question: 10-Quel est le rythme de travail des collaborateurs du cinéma?
 * Formula:
 * - Meal value: days_per_week * WEEKS_PER_YEAR
 * - Transport value: distance_km * days_per_week * WEEKS_PER_YEAR
 */
const calculateWorkRhythm: TableEmissionCalculator = {
  calculate: async (row, study) => {
    const daysPerWeek = parseFloat(row.data['11-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema'] || '0')
    const distanceKm = parseFloat(row.data['12-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema'] || '0')
    const transportMode = row.data['13-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema'] || ''

    // Validate that all required values are present and valid
    if (!daysPerWeek || daysPerWeek <= 0 || !distanceKm || distanceKm <= 0 || !transportMode) {
      return {
        emissionSources: [],
        breakdown: {
          mealEmissions: 0,
          transportEmissions: 0,
        },
        totalEmissions: 0,
      }
    }

    const emissionSources: EmissionSourceCalculation[] = []

    // Calculate meal emissions
    if (daysPerWeek > 0 && MEAL_EMISSION_FACTOR_ID) {
      const mealEmissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
        MEAL_EMISSION_FACTOR_ID,
        study.emissionFactorVersions.map((v) => v.importVersionId),
      )

      if (mealEmissionFactor) {
        // Store raw value (days per year), not pre-calculated CO2
        const mealValue = daysPerWeek * WEEKS_PER_YEAR
        emissionSources.push({
          name: 'meal',
          value: mealValue, // Raw value: total days per year
          emissionFactorId: mealEmissionFactor.id,
        })
      }
    }

    // The transportMode value is always the emission factor ID directly
    const transportEmissionFactorId = transportMode

    // Calculate transport emissions
    if (daysPerWeek > 0 && distanceKm > 0 && transportEmissionFactorId) {
      const transportEmissionFactor = await getEmissionFactorByImportedIdAndStudiesEmissionSource(
        transportEmissionFactorId,
        study.emissionFactorVersions.map((v) => v.importVersionId),
      )

      if (transportEmissionFactor) {
        // Store raw value (km per year), not pre-calculated CO2
        const transportValue = distanceKm * daysPerWeek * WEEKS_PER_YEAR
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
    const distance = parseFloat(row.data['11-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'] || '0')
    const participants = parseFloat(
      row.data['13-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'] || '0',
    )
    const transportModeFE = row.data['14-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'] || ''
    const occurrences = parseFloat(row.data['15-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'] || '0')
    const accommodationTypeFE = row.data['16-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'] || ''
    const duration = parseFloat(row.data['17-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'] || '0')

    if (!distance || distance <= 0 || !participants || participants <= 0 || !occurrences || occurrences <= 0) {
      return {
        emissionSources: [],
      }
    }

    const emissionSources: EmissionSourceCalculation[] = []

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

    if (accommodationTypeFE && duration > 0) {
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

const tableEmissionCalculators: Record<string, TableEmissionCalculator> = {
  '10-quel-est-le-rythme-de-travail-des-collaborateurs-du-cinema': calculateWorkRhythm,
  '10-decrivez-les-deplacements-professionnels-de-vos-collaborateurs': calculateProfessionalTravel,
}

/**
 * Check if a table question has a specific emission calculator
 */
export const hasTableEmissionCalculator = (questionIdIntern: string): boolean => {
  return questionIdIntern in tableEmissionCalculators
}

/**
 * Calculate emissions for a table question
 */
export const calculateTableEmissions = async (
  question: Question,
  tableAnswer: TableAnswer,
  study: FullStudy,
): Promise<TableEmissionCalculationResult[]> => {
  const calculator = tableEmissionCalculators[question.idIntern]

  if (!calculator) {
    // No specific calculator found, return empty results
    return []
  }

  const results: TableEmissionCalculationResult[] = []

  for (const row of tableAnswer.rows) {
    const result = await calculator.calculate(row, study)
    results.push(result)
  }

  return results
}
