import { BCPost, CutPost, Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { filterWithDependencies } from '@/services/results/utils'
import { Theme } from '@mui/material/styles'
import { SubPost } from '@prisma/client'
import { useMemo } from 'react'

interface ComputeResult {
  label: string
  post: SubPost | Post | 'total'
  value: number
  subPosts: ResultsByPost[]
  numberOfEmissionSource: number
  numberOfValidatedEmissionSource: number
  uncertainty?: number
}

type PostKey = CutPost | BCPost

type TFunction = (key: string) => string

export const useComputedResults = (resultsByPost: ResultsByPost[], tPost: TFunction, listPosts: PostKey[]) =>
  useMemo(() => {
    const validPosts = new Set(Object.values(listPosts))

    return resultsByPost
      .map((post) => {
        const filteredSubPosts = post.subPosts.filter((subPost) =>
          filterWithDependencies(subPost.post as SubPost, false),
        )
        const value = filteredSubPosts.reduce((res, subPost) => res + subPost.value, 0)
        // const value = 23

        return { ...post, subPosts: filteredSubPosts, value }
      })
      .filter((post) => validPosts.has(post.post as PostKey))
      .map((post) => ({ ...post, label: tPost(post.post) }))
  }, [resultsByPost, tPost, listPosts])

export const useChartData = (computeResults: ComputeResult[], theme: Theme) =>
  useMemo(() => {
    const pieData = computeResults
      .map(({ label, value, post }) => ({ label, value, color: theme.custom.postColors[post].light }))
      .filter((computeResult) => computeResult.value > 0)
    const barData = {
      labels: computeResults.map(({ label }) => label),
      values: computeResults.map(({ value }) => value),
      colors: computeResults.map(({ post }) => theme.custom.postColors[post].light),
    }
    return { pieData, barData }
  }, [computeResults, theme])
