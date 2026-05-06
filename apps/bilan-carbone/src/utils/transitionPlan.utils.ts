import type { FullStudy } from '@/db/study'
import { getStudyTotalCo2Emissions } from '@/services/study'
import type { PastStudy } from '@/types/trajectory.types'
import type { ExternalStudy } from '@abc-transitionbascarbone/db-common'
import { StudyResultUnit } from '@abc-transitionbascarbone/db-common/enums'
import { filterStringArray } from './array'
import { convertValue } from './study'

export const convertToPastStudies = (
  linkedStudies: FullStudy[],
  externalStudies: ExternalStudy[],
  validatedOnly: boolean,
  studyUnit: StudyResultUnit,
): PastStudy[] => {
  const pastStudies: PastStudy[] = []

  linkedStudies.forEach((study) => {
    const totalCo2InLinkedUnit = getStudyTotalCo2Emissions(study, true, validatedOnly)
    const totalCo2 = convertValue(totalCo2InLinkedUnit, study.resultsUnit, studyUnit)

    pastStudies.push({
      id: study.id,
      name: study.name,
      type: 'linked',
      year: study.startDate.getFullYear(),
      totalCo2,
    })
  })

  externalStudies.forEach((study) => {
    pastStudies.push({
      id: study.id,
      name: study.name,
      type: 'external',
      year: study.date.getFullYear(),
      totalCo2: convertValue(Number(study.totalCo2Kg), StudyResultUnit.K, studyUnit),
    })
  })

  return pastStudies.sort((a, b) => a.year - b.year)
}

export const readStoredStringArray = (key: string): string[] | null => {
  if (typeof window === 'undefined') {
    return null
  }
  const stored = localStorage.getItem(key)
  if (!stored) {
    return null
  }
  try {
    const parsed = JSON.parse(stored) as unknown
    if (!Array.isArray(parsed)) {
      return null
    }
    return filterStringArray(parsed)
  } catch {
    return null
  }
}

export const getInitialCurrentStep = (storageKey: string, trajectoriesLength: number): number | 'complete' => {
  if (typeof window === 'undefined') {
    return trajectoriesLength > 0 ? 'complete' : 0
  }
  const stored = localStorage.getItem(storageKey)
  if (stored !== null && stored !== 'complete') {
    return parseInt(stored, 10)
  }
  if (stored === 'complete' || trajectoriesLength > 0) {
    localStorage.setItem(storageKey, 'complete')
    return 'complete'
  }
  return 0
}
