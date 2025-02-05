import { FullStudy } from '@/db/study'
import { SubPost } from '@prisma/client'

export const getSiteEmissionSources = (emissionSources: FullStudy['emissionSources'], studySite: string) =>
  studySite === 'all'
    ? emissionSources
    : emissionSources.filter((emissionSource) => emissionSource.studySite.id === studySite)

export const filterWithDependencies = (subPost: SubPost, withDependencies: boolean) =>
  withDependencies || subPost !== SubPost.UtilisationEnDependance
