import { Post } from '@/services/posts'
import { SubPost } from '@prisma/client'

export const postsWithGlossaryTilt = [
  Post.IntrantsBiensEtMatieresTilt,
  Post.Alimentation,
  Post.IntrantsServices,
  Post.EquipementsEtImmobilisations,
  Post.ConstructionDesLocaux,
  Post.Energies,
  Post.DechetsDirects,
  Post.FroidEtClim,
  Post.Utilisation,
  Post.FinDeVie,
  Post.Teletravail,
] as Post[]
export const subPostsWithGlossaryTilt = [
  SubPost.DeplacementsFabricationDesVehicules,
  SubPost.DeplacementsDomicileTravailSalaries,
  SubPost.DeplacementsDomicileTravailBenevoles,
  SubPost.DeplacementsDansLeCadreDUneMissionAssociativeSalaries,
  SubPost.DeplacementsDansLeCadreDUneMissionAssociativeBenevoles,
  SubPost.DeplacementsDesBeneficiaires,
  SubPost.Fret,
  SubPost.TransportFabricationDesVehicules,
  SubPost.Agriculture,
  SubPost.ActivitesIndustrielles,
] as SubPost[]
