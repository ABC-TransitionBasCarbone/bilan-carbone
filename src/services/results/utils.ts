import { FullStudy } from '@/db/study'
import { SubPost } from '@prisma/client'

export const getSiteEmissionSources = (emissionSources: FullStudy['emissionSources'], site: string) =>
  site === 'all' ? emissionSources : emissionSources.filter((emissionSource) => emissionSource.site.id === site)

export const filterWithDependencies = (subPost: SubPost, withDependencies: boolean) =>
  withDependencies || subPost !== SubPost.UtilisationEnDependance
