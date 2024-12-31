import { FullStudy } from '@/db/study'
import { SubPost } from '@prisma/client'
import { getEmissionSourcesTotalCo2, sumEmissionSourcesUncertainty } from '../emissionSource'
import { Post, subPostsByPost } from '../posts'

export type ResultsByPost = {
  post: Post | SubPost | 'total'
  value: number
  numberOfEmissionSource?: number
  numberOfValidatedEmissionSource?: number
  uncertainty?: number
  subPosts?: ResultsByPost[]
}

const computeUncertainty = (uncertaintyToReduce: ResultsByPost[], value: number) => {
  return Math.exp(
    Math.sqrt(
      uncertaintyToReduce.reduce(
        (acc, subPost) => acc + Math.pow(subPost.value / value, 2) * Math.pow(Math.log(subPost.uncertainty || 1), 2),
        0,
      ),
    ),
  )
}

export const computeResultsByPost = (
  study: FullStudy,
  tPost: (key: string) => string,
  site: string,
  withDependancies: boolean,
) => {
  const siteEmissionSources =
    site === 'all'
      ? study.emissionSources
      : study.emissionSources.filter((emissionSource) => emissionSource.site.id === site)

  const postInfos = Object.values(Post)
    .sort((a, b) => tPost(a).localeCompare(tPost(b)))
    .map((post) => {
      const subPosts = subPostsByPost[post]
        .filter((subPost) => withDependancies || subPost !== SubPost.UtilisationEnDependance)
        .map((subPost) => {
          const emissionSources = siteEmissionSources.filter(
            (emissionSource) => emissionSource.subPost === subPost && emissionSource.validated,
          )

          return {
            post: subPost,
            value: getEmissionSourcesTotalCo2(emissionSources),
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
    } as ResultsByPost,
  ]
}
