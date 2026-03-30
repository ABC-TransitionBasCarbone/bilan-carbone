import type { FullStudy } from '@/db/study'
import { getStudyTotalCo2Emissions } from '@/services/study'
import type { PastStudy } from '@/types/trajectory.types'
import type { ExternalStudy } from '@repo/db-common'
import { StudyResultUnit } from '@repo/db-common/enums'
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
