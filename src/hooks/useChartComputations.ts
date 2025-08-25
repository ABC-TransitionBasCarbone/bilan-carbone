import { FullStudy } from '@/db/study'
import { computeResultsByPost } from '@/services/results/consolidated'
import { filterWithDependencies } from '@/services/results/utils'
import { ResultType } from '@/services/study'
import { getPostValues } from '@/utils/post'
import { Environment, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

interface UseChartComputationsParams {
  study: FullStudy
  studySite: string
  validatedOnly?: boolean
  environment: Environment
  withDep: boolean
  type?: ResultType
}

export const useChartComputations = ({
  study,
  studySite,
  validatedOnly = false,
  environment,
  withDep,
  type,
}: UseChartComputationsParams) => {
  const tPost = useTranslations('emissionFactors.post')

  const postValues = useMemo(() => getPostValues(environment, type), [environment, type])

  const resultsByPost = useMemo(
    () => computeResultsByPost(study, tPost, studySite, withDep, validatedOnly, postValues, environment, type),
    [study, tPost, studySite, withDep, validatedOnly, postValues, environment, type],
  )

  const computeResults = useMemo(() => {
    return resultsByPost
      .map((post) => {
        const filteredSubPosts = post.subPosts.filter((subPost) =>
          filterWithDependencies(subPost.post as SubPost, withDep),
        )
        const value = filteredSubPosts.reduce((res, subPost) => res + subPost.value, 0)

        return { ...post, subPosts: filteredSubPosts, value }
      })
      .filter((post) => post.post !== 'total')
      .map((post) => ({ ...post, label: tPost(post.post) }))
  }, [resultsByPost, tPost, withDep])

  return {
    resultsByPost,
    computeResults,
  }
}
