import { BCPost, CutPost, Post, subPostsByPost, TiltPost } from '@/services/posts'
import { AdditionalResultTypes, ResultType } from '@/services/study'
import { Environment, SubPost } from '@prisma/client'

export const getPost = (subPost?: SubPost) =>
  subPost
    ? (Object.keys(subPostsByPost).find((post) => subPostsByPost[post as Post].includes(subPost)) as Post)
    : undefined

export const flattenSubposts = (subPosts: Record<Post, SubPost[]>) =>
  Object.keys(subPosts)
    .map((post) => (subPosts?.[post as Post] || []).flat())
    .flat()

const withInfobulleList: (Post | SubPost)[] = [
  Post.DechetsDirects,
  Post.IntrantsBiensEtMatieres,
  Post.Immobilisations,
  Post.FinDeVie,
  SubPost.DeplacementsDomicileTravail,
  SubPost.DeplacementsProfessionnels,
  SubPost.DeplacementsVisiteurs,
  SubPost.CombustiblesFossiles,
  SubPost.CombustiblesOrganiques,
  SubPost.ReseauxDeChaleurEtDeVapeur,
  SubPost.ReseauxDeFroid,
  SubPost.Electricite,
  SubPost.Agriculture,
  SubPost.EmissionsLieesAuChangementDAffectationDesSolsCas,
  SubPost.EmissionsLieesALaProductionDeFroid,
  SubPost.EmissionsLieesAuxProcedesIndustriels,
  SubPost.FretInterne,
  SubPost.ServicesEnApprocheMonetaire,
  SubPost.MatiereDestineeAuxEmballages,
  SubPost.BiensEtMatieresEnApprocheMonetaire,
  SubPost.UtilisationEnResponsabilite,
  SubPost.UtilisationEnDependance,
]

export const withInfobulle = (post: Post | SubPost) => withInfobulleList.includes(post)

export const isPost = (post: Post | SubPost | 'total'): post is Post => {
  return post in Post
}

export const getPostValues = (environment: Environment | undefined, type?: ResultType) => {
  if (!environment) {
    return BCPost
  }

  switch (environment) {
    case Environment.TILT:
      return type === AdditionalResultTypes.ENV_SPECIFIC_EXPORT ? TiltPost : BCPost
    case Environment.CUT:
      return CutPost
    case Environment.BC:
    default:
      return BCPost
  }
}
