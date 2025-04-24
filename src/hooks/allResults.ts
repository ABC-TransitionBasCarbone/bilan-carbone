import { CutPost } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { filterWithDependencies } from '@/services/results/utils'
import { Theme } from '@mui/material/styles'
import { SubPost } from '@prisma/client'
import { useMemo } from 'react'

interface ComputeResult {
  label: string
  value: number
  subPosts: ResultsByPost[]
  numberOfEmissionSource: number
  numberOfValidatedEmissionSource: number
  uncertainty?: number
}

type TFunction = (key: string) => string

export function useComputedResults(resultsByPost: ResultsByPost[], tPost: TFunction) {
  return useMemo(() => {
    const validCutPosts = new Set(Object.values(CutPost))

    return resultsByPost
      .map((post) => {
        const filteredSubPosts = post.subPosts.filter((subPost) =>
          filterWithDependencies(subPost.post as SubPost, false),
        )
        const value = filteredSubPosts.reduce((res, subPost) => res + subPost.value, 0)

        return {
          ...post,
          subPosts: filteredSubPosts,
          value,
        }
      })
      .filter((post) => validCutPosts.has(post.post as CutPost))
      .map(({ post, ...rest }) => ({
        ...rest,
        label: tPost(post),
      }))
  }, [resultsByPost, tPost])
}

export function useChartData(computeResults: ComputeResult[], theme: Theme) {
  const pieData = useMemo(() => {
    return computeResults
      .map(({ label, value }) => ({ label, value, color: theme.palette.primary.main }))
      .filter((computeResult) => computeResult.value > 0)
  }, [computeResults, theme])

  const barData = useMemo(() => {
    return {
      labels: computeResults.map(({ label }) => label),
      values: computeResults.map(({ value }) => value),
    }
  }, [computeResults])

  return { pieData, barData }
}
