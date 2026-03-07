import { FullStudy } from '@/db/study'
import { getStudyTotalCo2Emissions } from '@/services/study'
import { getUIFilteredEmissions } from '@/utils/study'
import { convertToPastStudies, PastStudy } from '@/utils/trajectory'
import type { ExternalStudy, SubPost } from '@prisma/client'
import { useMemo } from 'react'

interface Params {
  study: FullStudy
  linkedStudies: FullStudy[]
  linkedExternalStudies: ExternalStudy[]
  validatedOnly: boolean
  selectedSiteIds: string[]
  selectedSubPosts: SubPost[]
  selectedTagIds: string[]
}

interface Result {
  pastStudies: PastStudy[]
  studyTotalEmissions: number
  filteredStudyEmissions: number
  filterRatio: number
  filteredPastStudies: PastStudy[]
}

export const useTransitionPlan = ({
  study,
  linkedStudies,
  linkedExternalStudies,
  validatedOnly,
  selectedSiteIds,
  selectedSubPosts,
  selectedTagIds,
}: Params): Result => {
  const pastStudies = useMemo(
    () => convertToPastStudies(linkedStudies, linkedExternalStudies, validatedOnly, study.resultsUnit),
    [linkedStudies, linkedExternalStudies, validatedOnly, study.resultsUnit],
  )

  const studyTotalEmissions = useMemo(
    () => getStudyTotalCo2Emissions(study, true, validatedOnly),
    [study, validatedOnly],
  )

  const filteredStudyEmissions = useMemo(
    () => getUIFilteredEmissions(study, validatedOnly, selectedSiteIds, selectedSubPosts, selectedTagIds),
    [study, validatedOnly, selectedSiteIds, selectedSubPosts, selectedTagIds],
  )

  const filterRatio = studyTotalEmissions > 0 ? filteredStudyEmissions / studyTotalEmissions : 1

  const filteredPastStudies = useMemo(
    () => pastStudies.map((ps) => ({ ...ps, totalCo2: ps.totalCo2 * filterRatio })),
    [pastStudies, filterRatio],
  )

  return { pastStudies, studyTotalEmissions, filteredStudyEmissions, filterRatio, filteredPastStudies }
}
