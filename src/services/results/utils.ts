import { FullStudy } from '@/db/study'
import { SubPost } from '@prisma/client'
import { ResultsByPost } from './consolidated'

export const getSiteEmissionSources = (emissionSources: FullStudy['emissionSources'], studySite: string) =>
  studySite === 'all'
    ? emissionSources
    : emissionSources.filter((emissionSource) => emissionSource.studySite.id === studySite)

export const filterWithDependencies = (subPost: SubPost, withDependencies: boolean) =>
  withDependencies || subPost !== SubPost.UtilisationEnDependance

export const mapResultsByPost = (allComputedResults: ResultsByPost[], withDependencies: boolean) =>
  allComputedResults
    .map((post) => ({
      ...post,
      subPosts: post.subPosts.filter((subPost) => filterWithDependencies(subPost.post as SubPost, withDependencies)),
    }))
    .map((post) => ({ ...post, value: post.subPosts.reduce((res, subPost) => res + subPost.value, 0) }))
