import { FullStudy } from '@/db/study'
import { SubPost } from '@prisma/client'
import { getEmissionSourcesTotalCo2, sumEmissionSourcesUncertainty } from '../emissionSource'
import { Post, subPostsByPost } from '../posts'
import { filterWithDependencies, getSiteEmissionSources } from './utils'

export type ResultsByPost = {
  post: Post | SubPost | 'total'
  value: number
  numberOfEmissionSource: number
  numberOfValidatedEmissionSource: number
  uncertainty?: number
  subPosts: ResultsByPost[]
}

const computeUncertainty = (uncertaintyToReduce: { value: number; uncertainty?: number }[], value: number) => {
  return Math.exp(
    Math.sqrt(
      uncertaintyToReduce.reduce((acc, info) => {
        if (!info.value) {
          return acc
        }

        return acc + Math.pow(info.value / value, 2) * Math.pow(Math.log(info.uncertainty || 1), 2)
      }, 0),
    ),
  )
}

export const computeResultsByPost = (
  study: FullStudy,
  tPost: (key: string) => string,
  studySite: string,
  withDependencies: boolean,
  validatedOnly: boolean = true,
) => {
  const siteEmissionSources = getSiteEmissionSources(study.emissionSources, studySite)

  const postInfos = Object.values(Post)
    .sort((a, b) => tPost(a).localeCompare(tPost(b)))
    .map((post) => {
      const subPosts = subPostsByPost[post]
        .filter((subPost) => filterWithDependencies(subPost, withDependencies))
        .map((subPost) => {
          const emissionSources = siteEmissionSources.filter((emissionSource) => emissionSource.subPost === subPost)
          const validatedEmissionSources = emissionSources.filter(
            (emissionSource) => !validatedOnly || emissionSource.validated,
          )

          return {
            post: subPost,
            value: getEmissionSourcesTotalCo2(validatedEmissionSources, study.wasteImpact),
            numberOfEmissionSource: emissionSources.length,
            numberOfValidatedEmissionSource: validatedEmissionSources.length,
            uncertainty: sumEmissionSourcesUncertainty(validatedEmissionSources),
          }
        })
        .filter((subPost) => subPost.numberOfEmissionSource > 0)

      const value = subPosts.flatMap((subPost) => subPost).reduce((acc, subPost) => acc + subPost.value, 0)

      return {
        post,
        value,
        uncertainty: subPosts.length > 0 ? computeUncertainty(subPosts, value) : undefined,
        subPosts: subPosts.sort((a, b) => tPost(a.post).localeCompare(tPost(b.post))),
        numberOfEmissionSource: subPosts.reduce((acc, subPost) => acc + subPost.numberOfEmissionSource, 0),
        numberOfValidatedEmissionSource: subPosts.reduce(
          (acc, subPost) => acc + subPost.numberOfValidatedEmissionSource,
          0,
        ),
      } as ResultsByPost
    })

  const value = postInfos.reduce((acc, post) => acc + post.value, 0)
  return [
    ...postInfos,
    {
      post: 'total',
      value,
      subPosts: [],
      uncertainty: computeUncertainty(postInfos, value),
      numberOfEmissionSource: postInfos.reduce((acc, post) => acc + post.numberOfEmissionSource, 0),
      numberOfValidatedEmissionSource: postInfos.reduce((acc, post) => acc + post.numberOfValidatedEmissionSource, 0),
    } as ResultsByPost,
  ]
}
