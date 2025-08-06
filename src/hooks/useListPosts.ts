import { CutPost, Post } from '@/services/posts'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { Environment } from '@prisma/client'

export function useListPosts(): Array<CutPost | Post> {
  const { environment } = useAppEnvironmentStore()
  switch (environment) {
    case Environment.CUT:
      return [
        CutPost.Dechets,
        CutPost.BilletterieEtCommunication,
        CutPost.ConfiseriesEtBoissons,
        CutPost.Fonctionnement,
        CutPost.MobiliteSpectateurs,
        CutPost.SallesEtCabines,
        CutPost.TourneesAvantPremieres,
      ] as CutPost[]
    default:
      return [
        Post.Energies,
        Post.DechetsDirects,
        Post.IntrantsBiensEtMatieres,
        Post.IntrantsServices,
        Post.AutresEmissionsNonEnergetiques,
        Post.Fret,
        Post.Deplacements,
        Post.Immobilisations,
        Post.UtilisationEtDependance,
        Post.FinDeVie,
      ] as Post[]
  }
}
