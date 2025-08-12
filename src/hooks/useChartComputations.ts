import { FullStudy } from '@/db/study'
import { BCPost, CutPost, environmentPostMapping, Post, TiltPost } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { filterWithDependencies } from '@/services/results/utils'
import { AdditionalResultTypes, ResultType } from '@/services/study'
import { formatNumber } from '@/utils/number'
import { Environment, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'

interface UseChartComputationsParams {
  study: FullStudy
  studySite: string
  validatedOnly?: boolean
  postValues: typeof Post | typeof CutPost | typeof BCPost | typeof TiltPost
  environment: Environment
  type?: ResultType
}

export const useChartComputations = ({
  study,
  studySite,
  validatedOnly = false,
  postValues,
  environment,
  type
}: UseChartComputationsParams) => {
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')

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
    const validPosts = new Set(Object.values(postValues)) // Ici il faut réussir à récupérer les infos des bons postes, soit ceux passés soit suivant le type mettre ceux du BC ou de l'env ? 

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
  }, [resultsByPost, tPost])

  return {
    resultsByPost,
    chartFormatter,
    computeResults,
    tUnits,
  }
}
