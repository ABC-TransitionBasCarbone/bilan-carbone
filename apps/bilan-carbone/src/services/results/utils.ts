import { FullStudy } from '@/db/study'
import { getBaseFilteredEmissionSources } from '@/utils/study'
import { SubPost } from '@prisma/client'

export const getSiteEmissionSourcesWithoutMarketBase = <
  T extends Pick<FullStudy['emissionSources'][number], 'studySite' | 'emissionFactor'>,
>(
  emissionSources: T[],
  studySite: string,
): T[] =>
  getBaseFilteredEmissionSources(
    studySite === 'all'
      ? emissionSources
      : emissionSources.filter((emissionSource) => emissionSource.studySite.id === studySite),
  )

export const getAllSiteEmissionSources = <T extends Pick<FullStudy['emissionSources'][number], 'studySite'>>(
  emissionSources: T[],
  studySite: string,
): T[] =>
  studySite === 'all'
    ? emissionSources
    : emissionSources.filter((emissionSource) => emissionSource.studySite.id === studySite)

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
