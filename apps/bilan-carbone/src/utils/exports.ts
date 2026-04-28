import { EmissionFactorWithParts } from '@/db/emissionFactors'
import type { FullStudy } from '@/db/study'
import { getEmissionResults } from '@/services/emissionSource'
import { getBegesEmissionTotal } from '@/services/results/beges'
import { getGHGPEmissionTotal } from '@/services/results/ghgp'
import { Environment, Export, StudyResultUnit } from '@repo/db-common/enums'
import { Translations } from '@repo/lib'
import { formatNumber } from './number'
import { STUDY_UNIT_VALUES } from './study'

const getExportEmissionTotal = (
  emissionSource: FullStudy['emissionSources'][number],
  emissionFactor: EmissionFactorWithParts,
  type: Export,
  environment: Environment,
  studyStartDate: Date,
) => {
  switch (type) {
    case Export.Beges:
      return getBegesEmissionTotal(emissionSource, emissionFactor)
    case Export.GHGP:
      return getGHGPEmissionTotal(emissionSource, emissionFactor, studyStartDate)
    default:
      return getEmissionResults(emissionSource, environment).emissionValue
  }
}

export const formatDifferenceTableEmissions = (
  emissionSources: FullStudy['emissionSources'],
  emissionFactorsWithParts: EmissionFactorWithParts[],
  resultsUnit: StudyResultUnit,
  environment: Environment,
  tPost: Translations,
  type: Export,
  studyStartDate: Date,
) => {
  const unitValue = STUDY_UNIT_VALUES[resultsUnit]

  return emissionSources
    .map((emissionSource) => {
      const emissionFactor = emissionFactorsWithParts.find((ef) => ef.id === emissionSource.emissionFactor?.id)
      if (!emissionFactor || !emissionSource.value) {
        return null
      }

      const exportValue =
        getExportEmissionTotal(emissionSource, emissionFactor, type, environment, studyStartDate) / unitValue
      const consolidatedValue = getEmissionResults(emissionSource, environment).emissionValue / unitValue
      const exportValueToDisplay = formatNumber(Math.round(exportValue), 0)
      const consolidatedValueToDisplay = formatNumber(Math.round(consolidatedValue), 0)
      const difference = exportValue - consolidatedValue

      return {
        source: emissionSource,
        post: tPost(emissionSource.subPost),
        difference,
        differenceToDisplay: formatNumber(Math.round(difference), 0),
        consolidatedValueToDisplay,
        exportValueToDisplay,
      }
    })
    .filter((item) => item && Math.abs(item?.difference) > 0)
    .filter((item) => !!item)
}

export const computeDifferenceForTableEmissions = (emissions: ReturnType<typeof formatDifferenceTableEmissions>) => {
  return emissions.reduce((total, item) => total + item.difference, 0)
}
