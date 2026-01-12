import { FullStudy } from '@/db/study'
import { Translations } from '@/types/translation'
import { Environment, SubPost } from '@prisma/client'
import {
  getEmissionResults,
  getEmissionSourcesTotalCo2,
  getEmissionSourcesTotalMonetaryCo2,
  sumEmissionSourcesUncertainty,
} from '../emissionSource'
import { BCPost, ClicksonPost, convertTiltSubPostToBCSubPost, CutPost, Post, subPostsByPost, TiltPost } from '../posts'
import { AdditionalResultTypes, ResultType } from '../study'
import { filterWithDependencies, getSiteEmissionSources } from './utils'

export type BaseResultsByPost = {
  post: Post | SubPost | 'total'
  label: string
  value: number
  children: BaseResultsByPost[]
}

export type ResultsByPost = Omit<BaseResultsByPost, 'children'> & {
  monetaryValue: number
  nonSpecificMonetaryValue: number
  numberOfEmissionSource: number
  numberOfValidatedEmissionSource: number
  uncertainty: number
  children: ResultsByPost[]
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

export const computeResultsByPostFromEmissionSources = (
  study: FullStudy,
  tPost: (key: string) => string,
  studySite: string,
  withDependencies: boolean,
  validatedOnly: boolean = true,
  postValues: typeof Post | typeof CutPost | typeof BCPost | typeof TiltPost | typeof ClicksonPost = BCPost,
  environment: Environment,
  type?: ResultType,
): ResultsByPost[] => {
  const siteEmissionSources = getSiteEmissionSources(study.emissionSources, studySite)
  const convertToBc = type === AdditionalResultTypes.CONSOLIDATED && environment !== Environment.BC
  const convertedSiteEmissionSources = convertToBc
    ? siteEmissionSources.map((emissionSource) => {
        return { ...emissionSource, subPost: convertTiltSubPostToBCSubPost(emissionSource.subPost) }
      })
    : siteEmissionSources

  const emissionSourceWithEmissionValue = convertedSiteEmissionSources.map((emissionSource) => ({
    ...emissionSource,
    ...getEmissionResults(emissionSource, environment),
  }))

  const postInfos = Object.values(convertToBc ? BCPost : postValues)
    .map((post: Post) => {
      const subPosts = subPostsByPost[post]
        .filter((subPost) => filterWithDependencies(subPost, withDependencies))
        .map((subPost) => {
          const emissionSources = emissionSourceWithEmissionValue.filter(
            (emissionSource) => emissionSource.subPost === subPost,
          )
          const validatedEmissionSources = emissionSources.filter((emissionSource) => emissionSource.validated)
          const emissionSourcesToUse = validatedOnly ? validatedEmissionSources : emissionSources

          return {
            post: subPost,
            label: tPost(subPost),
            value: getEmissionSourcesTotalCo2(emissionSourcesToUse),
            monetaryValue: getEmissionSourcesTotalMonetaryCo2(emissionSourcesToUse, false),
            nonSpecificMonetaryValue: getEmissionSourcesTotalMonetaryCo2(emissionSourcesToUse, true),
            numberOfEmissionSource: emissionSources.length,
            numberOfValidatedEmissionSource: validatedEmissionSources.length,
            uncertainty: sumEmissionSourcesUncertainty(emissionSourcesToUse),
          }
        })

      const value = subPosts.flatMap((subPost) => subPost).reduce((acc, subPost) => acc + subPost.value, 0)
      const monetaryValue = subPosts
        .flatMap((subPost) => subPost)
        .reduce((acc, subPost) => acc + subPost.monetaryValue, 0)
      const nonSpecificMonetaryValue = subPosts
        .flatMap((subPost) => subPost)
        .reduce((acc, subPost) => acc + subPost.nonSpecificMonetaryValue, 0)

      return {
        post,
        label: tPost(post),
        value,
        monetaryValue,
        nonSpecificMonetaryValue,
        uncertainty: subPosts.length > 0 ? computeUncertainty(subPosts, value) : undefined,
        children: subPosts.sort((a, b) => tPost(a.post).localeCompare(tPost(b.post))),
        numberOfEmissionSource: subPosts.reduce((acc, subPost) => acc + subPost.numberOfEmissionSource, 0),
        numberOfValidatedEmissionSource: subPosts.reduce(
          (acc, subPost) => acc + subPost.numberOfValidatedEmissionSource,
          0,
        ),
      } as ResultsByPost
    })
    .sort((a, b) => a.label.localeCompare(b.label))

  return [...postInfos, computeTotalForPosts(postInfos, tPost)]
}

export const computeTotalForPosts = (postInfos: ResultsByPost[], tPost: (key: string) => string): ResultsByPost => {
  const value = postInfos.reduce((acc, post) => acc + post.value, 0)

  return {
    post: 'total',
    label: tPost('total'),
    value,
    monetaryValue: postInfos.reduce((acc, post) => acc + post.monetaryValue, 0),
    nonSpecificMonetaryValue: postInfos.reduce((acc, post) => acc + post.nonSpecificMonetaryValue, 0),
    children: [],
    uncertainty: computeUncertainty(postInfos, value),
    numberOfEmissionSource: postInfos.reduce((acc, post) => acc + post.numberOfEmissionSource, 0),
    numberOfValidatedEmissionSource: postInfos.reduce((acc, post) => acc + post.numberOfValidatedEmissionSource, 0),
  }
}

export type ResultsByTag = {
  value: number
  familyId: string
  label: string
  uncertainty: number
  children: { label: string; value: number; color: string; uncertainty: number; tagFamily: string }[]
}

export const computeResultsByTag = (
  study: {
    emissionSources: FullStudy['emissionSources']
    tagFamilies: FullStudy['tagFamilies']
  },
  studySite: string,
  withDependencies: boolean,
  validatedOnly: boolean = true,
  environment: Environment,
  t: Translations,
): ResultsByTag[] => {
  const siteEmissionSources = getSiteEmissionSources(study.emissionSources, studySite)
  const emissionSourceWithEmissionValue = siteEmissionSources
    .filter((emissionSource) => filterWithDependencies(emissionSource.subPost, withDependencies))
    .map((emissionSource) => ({
      ...emissionSource,
      ...getEmissionResults(emissionSource, environment),
    }))

  const tagFamiliesWithOthers = [
    ...study.tagFamilies,
    {
      id: 'otherFamily',
      name: t('other'),
      tags: [{ name: t('other'), id: 'other', color: '', familyId: 'otherFamily' }],
    },
  ]

  return tagFamiliesWithOthers
    .map((tagFamily) => {
      const tagInfos = tagFamily.tags
        .map((tag) => {
          const emissionSourcesforTag = emissionSourceWithEmissionValue.filter((emissionSource) =>
            tagFamily.id === 'otherFamily'
              ? emissionSource.emissionSourceTags.length === 0
              : emissionSource.emissionSourceTags?.some((emissionSourceTag) => emissionSourceTag.tag.id === tag.id),
          )

          const validatedEmissionSources = emissionSourcesforTag.filter((emissionSource) => emissionSource.validated)
          const emissionSourcesToUse = validatedOnly ? validatedEmissionSources : emissionSourcesforTag

          return {
            label: tag.name,
            tagFamily: tag.familyId,
            value: getEmissionSourcesTotalCo2(emissionSourcesToUse),
            color: tag.color ?? '',
            uncertainty: sumEmissionSourcesUncertainty(emissionSourcesToUse),
          }
        })
        .filter((tag) => tag.value > 0)

      const value = tagInfos.reduce((acc, post) => acc + post.value, 0)

      return {
        familyId: tagFamily.id,
        label: tagFamily.name,
        value,
        children: tagInfos.filter((tag) => tag.value > 0),
        uncertainty: computeUncertainty(tagInfos, value),
      }
    })
    .filter((family) => family.value > 0)
}
