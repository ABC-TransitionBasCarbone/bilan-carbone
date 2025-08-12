import { FullStudy } from '@/db/study'
import { BCPost, CutPost, environmentPostMapping, Post, TiltPost } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { filterWithDependencies } from '@/services/results/utils'
import { AdditionalResultTypes, ResultType } from '@/services/study'
import { formatNumber } from '@/utils/number'
import { getPostValues } from '@/utils/post'
import { Environment, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'

interface UseChartComputationsParams {
  study: FullStudy
  studySite: string
  validatedOnly?: boolean
  environment: Environment
  type?: ResultType
}

export const useChartComputations = ({
  study,
  studySite,
  validatedOnly = false,
  environment,
  type
}: UseChartComputationsParams) => {
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')

  const postValues = useMemo(() => getPostValues(environment, type), [environment, type])

  const resultsByPost = useMemo(
    () => computeResultsByPost(study, tPost, studySite, true, validatedOnly, postValues, environment, type),
    [study, studySite, tPost, validatedOnly, postValues, environment],
  )

  const chartFormatter = useCallback(
    (value: number | null, showUnit = true) => {
      const safeValue = value ?? 0
      const unit = showUnit ? tUnits(study.resultsUnit) : ''
      return `${formatNumber(safeValue, 2)} ${unit}`
    },
    [study.resultsUnit, tUnits],
  )

  const computeResults = useMemo(() => {
    return resultsByPost
      .map((post) => {
        const filteredSubPosts = post.subPosts.filter((subPost) =>
          filterWithDependencies(subPost.post as SubPost, false),
        )
        const value = filteredSubPosts.reduce((res, subPost) => res + subPost.value, 0)

        return { ...post, subPosts: filteredSubPosts, value }
      })
      .filter((post) => post.post !== 'total')
      .map((post) => ({ ...post, label: tPost(post.post) }))
  }, [resultsByPost, tPost])

  return {
    resultsByPost,
    chartFormatter,
    computeResults,
    tUnits,
  }
}
