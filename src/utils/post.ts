import { Post, subPostsByPost } from '@/services/posts'
import { SubPost } from '@prisma/client'

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
