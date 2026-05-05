import type { FullStudy } from '@/db/study'
import { getBaseFilteredEmissionSources } from '@/utils/study'
import { SubPost } from '@repo/db-common/enums'

export const getSiteEmissionSourcesWithoutMarketBase = <
  T extends Pick<FullStudy['emissionSources'][number], 'studySite' | 'emissionFactor'>,
>(
  emissionSources: T[],
  siteId: string,
): T[] =>
  getBaseFilteredEmissionSources(
    siteId === 'all'
      ? emissionSources
      : emissionSources.filter((emissionSource) => emissionSource.studySite.site.id === siteId),
  )

export const getAllSiteEmissionSources = <T extends Pick<FullStudy['emissionSources'][number], 'studySite'>>(
  emissionSources: T[],
  siteId: string,
): T[] =>
  siteId === 'all'
    ? emissionSources
    : emissionSources.filter((emissionSource) => emissionSource.studySite.site.id === siteId)

const dependencySubPosts = [
  SubPost.UtilisationEnDependance,
  SubPost.UtilisationEnDependanceConsommationDEnergie,
  SubPost.UtilisationEnDependanceConsommationDeBiens,
  SubPost.UtilisationEnDependanceConsommationNumerique,
  SubPost.UtilisationEnDependanceFuitesEtAutresConsommations,
] as SubPost[]

export const filterWithDependencies = (subPost: SubPost, withDependencies: boolean) =>
  withDependencies || !dependencySubPosts.includes(subPost)

export const filterEmissionSourcesWithDeps = (emissionSources: { subPost: SubPost; emissionValue: number }[]) => {
  return emissionSources.filter((source) => dependencySubPosts.includes(source.subPost))
}
