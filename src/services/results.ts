'use server'

import { FullStudy } from '@/db/study'
import { getTranslations } from 'next-intl/server'
import { sumEmissionSourcesUncertainty } from './emissionSource'
import { Post, subPostsByPost } from './posts'

export type ResultsByPost = {
  post: string
  value: number
  numberOfEmissionSource: number
  numberOfValidatedEmissionSource: number
  uncertainty?: number
  subPosts?: ResultsByPost[]
}

export const computeResultsByPost = async (study: FullStudy) => {
  const tPost = await getTranslations('emissionFactors.post')

  return Object.values(Post)
    .sort((a, b) => tPost(a).localeCompare(tPost(b)))
    .map((post) => {
      const subPosts = subPostsByPost[post]
        .map((subPost) => {
          const emissionSources = study.emissionSources.filter((emissionSource) => emissionSource.subPost === subPost)
          return {
            post: subPost,
            value: emissionSources.reduce(
              (acc, emission) =>
                acc +
                (!emission.value || !emission.emissionFactor ? 0 : emission.value * emission.emissionFactor.totalCo2),
              0,
            ),
            numberOfEmissionSource: emissionSources.length,
            numberOfValidatedEmissionSource: emissionSources.filter((es) => es.validated).length,
            uncertainty: sumEmissionSourcesUncertainty(emissionSources),
          }
        })
        .filter((subPost) => subPost.numberOfEmissionSource > 0)

      const value = subPosts.flatMap((subPost) => subPost).reduce((acc, subPost) => acc + subPost.value, 0)
      return {
        post,
        value,
        uncertainty:
          subPosts.length > 0
            ? Math.exp(
                Math.sqrt(
                  subPosts.reduce(
                    (acc, subPost) =>
                      acc + Math.pow(subPost.value / value, 2) * Math.pow(Math.log(subPost.uncertainty || 1), 2),
                    0,
                  ),
                ),
              )
            : undefined,
        subPosts: subPosts.sort((a, b) => tPost(a.post).localeCompare(tPost(b.post))),
        numberOfEmissionSource: subPosts.reduce((acc, subPost) => acc + subPost.numberOfEmissionSource, 0),
        numberOfValidatedEmissionSource: subPosts.reduce(
          (acc, subPost) => acc + subPost.numberOfValidatedEmissionSource,
          0,
        ),
      } as ResultsByPost
    })
}
