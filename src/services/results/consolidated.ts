import { FullStudy } from '@/db/study'
import { Environment, SubPost } from '@prisma/client'
import {
  getEmissionSourcesTotalCo2,
  getEmissionSourcesTotalMonetaryCo2,
  sumEmissionSourcesUncertainty,
} from '../emissionSource'
import { BCPost, convertTiltSubPostToBCSubPost, CutPost, Post, subPostsByPost, TiltPost } from '../posts'
import { AdditionalResultTypes, ResultType } from '../study'
import { filterWithDependencies, getSiteEmissionSources } from './utils'

export type ResultsByPost = {
  post: Post | SubPost | 'total'
  value: number
  monetaryValue: number
  nonSpecificMonetaryValue: number
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
  postValues: typeof Post | typeof CutPost | typeof BCPost | typeof TiltPost = BCPost,
  environment: Environment | undefined,
  type?: ResultType,
): ResultsByPost[] => {
  const siteEmissionSources = getSiteEmissionSources(study.emissionSources, studySite)
  const convertToBc = type === AdditionalResultTypes.CONSOLIDATED && environment !== Environment.BC
  const convertedSiteEmissionSources = convertToBc
    ? siteEmissionSources.map((emissionSource) => {
        return { ...emissionSource, subPost: convertTiltSubPostToBCSubPost(emissionSource.subPost) }
      })
    : siteEmissionSources

  const postInfos = Object.values(convertToBc ? BCPost : postValues)
    .sort((a, b) => tPost(a).localeCompare(tPost(b)))
    .map((post: Post) => {
      const subPosts = subPostsByPost[post]
        .filter((subPost) => filterWithDependencies(subPost, withDependencies))
        .map((subPost) => {
          const emissionSources = convertedSiteEmissionSources.filter(
            (emissionSource) => emissionSource.subPost === subPost,
          )
          const validatedEmissionSources = emissionSources.filter((emissionSource) => emissionSource.validated)

          return {
            post: subPost,
            value: getEmissionSourcesTotalCo2(
              validatedOnly ? validatedEmissionSources : emissionSources,
              convertToBc ? Environment.BC : environment,
            ),
            monetaryValue: getEmissionSourcesTotalMonetaryCo2(
              validatedOnly ? validatedEmissionSources : emissionSources,
            ),
            nonSpecificMonetaryValue: getEmissionSourcesTotalMonetaryCo2(
              validatedOnly ? validatedEmissionSources : emissionSources,
              false,
            ),
            numberOfEmissionSource: emissionSources.length,
            numberOfValidatedEmissionSource: validatedEmissionSources.length,
            uncertainty: sumEmissionSourcesUncertainty(validatedEmissionSources),
          }
        })
        .filter((subPost) => subPost.numberOfEmissionSource > 0)

      const value = subPosts.flatMap((subPost) => subPost).reduce((acc, subPost) => acc + subPost.value, 0)
      const monetaryValue = subPosts
        .flatMap((subPost) => subPost)
        .reduce((acc, subPost) => acc + subPost.monetaryValue, 0)
      const nonSpecificMonetaryValue = subPosts
        .flatMap((subPost) => subPost)
        .reduce((acc, subPost) => acc + subPost.nonSpecificMonetaryValue, 0)

      return {
        post,
        value,
        monetaryValue,
        nonSpecificMonetaryValue,
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
      monetaryValue: postInfos.reduce((acc, post) => acc + post.monetaryValue, 0),
      nonSpecificMonetaryValue: postInfos.reduce((acc, post) => acc + post.nonSpecificMonetaryValue, 0),
      subPosts: [],
      uncertainty: computeUncertainty(postInfos, value),
      numberOfEmissionSource: postInfos.reduce((acc, post) => acc + post.numberOfEmissionSource, 0),
      numberOfValidatedEmissionSource: postInfos.reduce((acc, post) => acc + post.numberOfValidatedEmissionSource, 0),
    } as ResultsByPost,
  ]
}

export type ResultsByTag = {
  label: string
  value: number
}

export const computeResultsByTag = (
  study: FullStudy,
  studySite: string,
  withDependencies: boolean,
  validatedOnly: boolean = true,
  environment: Environment,
): ResultsByTag[] => {
  const siteEmissionSources = getSiteEmissionSources(study.emissionSources, studySite)
  const tags = study.emissionSourceTagFamilies.flatMap((tagFamily) => tagFamily.emissionSourceTags)

  const emissionSourcesByTag = siteEmissionSources
    .filter((emissionSource) => !validatedOnly || emissionSource.validated)
    .filter((emissionSource) => filterWithDependencies(emissionSource.subPost, withDependencies))
    .reduce(
      (acc, emissionSource) => {
        if (!emissionSource.emissionSourceTags || emissionSource.emissionSourceTags.length === 0) {
          if (!acc['other']) {
            acc['other'] = []
          }
          acc['other'].push(emissionSource)
          return acc
        }

        emissionSource.emissionSourceTags.forEach((tag) => {
          if (!acc[tag.id]) {
            acc[tag.id] = []
          }
          acc[tag.id].push(emissionSource)
        })
        return acc
      },
      {} as Record<string, typeof siteEmissionSources>,
    )

  return [...tags, { id: 'other', name: 'other', color: '' }]
    .map((tag) => {
      const emissionSources = emissionSourcesByTag[tag.id] || []

      return {
        label: tag.name,
        value: getEmissionSourcesTotalCo2(emissionSources, environment),
        color: tag.color,
      }
    })
    .filter((tag) => tag.value > 0)
}
