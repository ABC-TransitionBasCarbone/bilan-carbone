import { FullStudy } from '@/db/study'
import { BCPost, CutPost, Post } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { filterWithDependencies } from '@/services/results/utils'
import { formatNumber } from '@/utils/number'
import { getPostByEnvironment } from '@/utils/post'
import { Environment, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'

interface UseChartComputationsParams {
  study: FullStudy
  studySite: string
  validatedOnly?: boolean
  postValues: typeof Post | typeof CutPost | typeof BCPost
  environment: Environment | undefined
}

export const useChartComputations = ({
  study,
  studySite,
  validatedOnly = false,
  postValues,
  environment,
}: UseChartComputationsParams) => {
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')

  const resultsByPost = useMemo(
    () => computeResultsByPost(study, tPost, studySite, true, validatedOnly, postValues, environment),
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

  const posts = getPostByEnvironment(environment)

  const computeResults = useMemo(() => {
    const validPosts = new Set(Object.values(posts))

    return resultsByPost
      .map((post) => {
        const filteredSubPosts = post.subPosts.filter((subPost) =>
          filterWithDependencies(subPost.post as SubPost, false),
        )
        const value = filteredSubPosts.reduce((res, subPost) => res + subPost.value, 0)

        return { ...post, subPosts: filteredSubPosts, value }
      })
      .filter((post) => validPosts.has(post.post as Post))
      .map((post) => ({ ...post, label: tPost(post.post) }))
  }, [posts, resultsByPost, tPost])

  return {
    resultsByPost,
    chartFormatter,
    computeResults,
    tUnits,
  }
}
