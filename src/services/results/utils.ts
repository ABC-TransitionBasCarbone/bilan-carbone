import { FullStudy } from '@/db/study'
import { SubPost } from '@prisma/client'

export const getSiteEmissionSources = (emissionSources: FullStudy['emissionSources'], studySite: string) =>
  studySite === 'all'
    ? emissionSources
    : emissionSources.filter((emissionSource) => emissionSource.studySite.id === studySite)

const dependencySubPosts = [
  SubPost.UtilisationEnDependance,
  SubPost.UtilisationEnDependanceConsommationDEnergie,
  SubPost.UtilisationEnDependanceConsommationDeBiens,
  SubPost.UtilisationEnDependanceConsommationNumerique,
  SubPost.UtilisationEnDependanceFuitesEtAutresConsommations
] as SubPost[]
export const filterWithDependencies = (subPost: SubPost, withDependencies: boolean) =>
  withDependencies || !dependencySubPosts.includes(subPost)
