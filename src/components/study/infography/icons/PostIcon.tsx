import { Post } from '@/services/posts'
import { AutresEmissionsNonEnergetiquesIcon } from './autresemissionsnonenergetiques'
import { BilletterieEtCommunicationIcon } from './billetterieetcommunication'
import { ConfiseriesEtBoissonsIcon } from './confiseriesetboissons'
import { DechetsIcon } from './dechets'
import { DechetsDirectsIcon } from './dechetsdirects'
import { DeplacementsIcon } from './deplacements'
import { EnergiesIcon } from './energies'
import { FinDeVieIcon } from './findevie'
import { FonctionnementIcon } from './fonctionnement'
import { FretIcon } from './fret'
import { ImmobilisationsIcon } from './immobilisations'
import { IntrantsBiensEtMatieresIcon } from './intrantsbiensetmatieres'
import { IntrantsServicesIcon } from './intrantsservices'
import { MobiliteSpectateursIcon } from './mobilitespecctateurs'
import { SallesEtCabinesIcon } from './sallesetcabines'
import { TourneesAvantPremiereIcon } from './tourneesavantpremiere'
import { UtilisationEtDependanceIcon } from './utilisationetdependance'

interface Props {
  post: Post
  className?: string
}

const PostIcon = ({ post, className }: Props) => {
  switch (post) {
    case Post.AutresEmissionsNonEnergetiques:
      return <AutresEmissionsNonEnergetiquesIcon className={className} />
    case Post.DechetsDirects:
      return <DechetsDirectsIcon className={className} />
    case Post.Deplacements:
      return <DeplacementsIcon className={className} />
    case Post.Energies:
      return <EnergiesIcon className={className} />
    case Post.Immobilisations:
      return <ImmobilisationsIcon className={className} />
    case Post.UtilisationEtDependance:
      return <UtilisationEtDependanceIcon className={className} />
    case Post.FinDeVie:
      return <FinDeVieIcon className={className} />
    case Post.IntrantsBiensEtMatieres:
      return <IntrantsBiensEtMatieresIcon className={className} />
    case Post.Fret:
      return <FretIcon className={className} />
    case Post.IntrantsServices:
      return <IntrantsServicesIcon className={className} />
    case Post.Fonctionnement:
      return <FonctionnementIcon className={className} />
    case Post.MobiliteSpectateurs:
      return <MobiliteSpectateursIcon className={className} />
    case Post.TourneesAvantPremiere:
      return <TourneesAvantPremiereIcon className={className} />
    case Post.SallesEtCabines:
      return <SallesEtCabinesIcon className={className} />
    case Post.ConfiseriesEtBoissons:
      return <ConfiseriesEtBoissonsIcon className={className} />
    case Post.Dechets:
      return <DechetsIcon className={className} />
    case Post.BilletterieEtCommunication:
      return <BilletterieEtCommunicationIcon className={className} />
  }
}

export default PostIcon
