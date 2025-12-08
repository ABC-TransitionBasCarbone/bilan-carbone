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

import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import ComputerOutlinedIcon from '@mui/icons-material/ComputerOutlined'
import FilterDramaOutlinedIcon from '@mui/icons-material/FilterDramaOutlined'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import LocalPizzaOutlinedIcon from '@mui/icons-material/LocalPizzaOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import MapsHomeWorkOutlinedIcon from '@mui/icons-material/MapsHomeWorkOutlined'
import TrainOutlinedIcon from '@mui/icons-material/TrainOutlined'
import { DeplacementsClicksonIcon } from './deplacementsClickson'
import { RestaurationIcon } from './restauration'

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
    case Post.EnergiesClickson:
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
    case Post.Achats:
    case Post.IntrantsServices:
      return <IntrantsServicesIcon className={className} />
    case Post.ImmobilisationsClickson:
    case Post.Fonctionnement:
      return <FonctionnementIcon className={className} />
    case Post.MobiliteSpectateurs:
      return <MobiliteSpectateursIcon className={className} />
    case Post.TourneesAvantPremieres:
      return <TourneesAvantPremiereIcon className={className} />
    case Post.SallesEtCabines:
      return <SallesEtCabinesIcon className={className} />
    case Post.ConfiseriesEtBoissons:
      return <ConfiseriesEtBoissonsIcon className={className} />
    case Post.Dechets:
      return <DechetsIcon className={className} />
    case Post.BilletterieEtCommunication:
      return <BilletterieEtCommunicationIcon className={className} />
    case Post.IntrantsBiensEtMatieresTilt:
      return <IntrantsBiensEtMatieresIcon className={className} />
    case Post.Alimentation:
      return <LocalPizzaOutlinedIcon className={className} />
    case Post.EquipementsEtImmobilisations:
      return <ComputerOutlinedIcon className={className} />
    case Post.DeplacementsDePersonne:
      return <TrainOutlinedIcon className={className} />
    case Post.TransportDeMarchandises:
      return <LocalShippingOutlinedIcon className={className} />
    case Post.ConstructionDesLocaux:
      return <MapsHomeWorkOutlinedIcon className={className} />
    case Post.FroidEtClim:
      return <AcUnitOutlinedIcon className={className} />
    case Post.AutresEmissions:
      return <FilterDramaOutlinedIcon className={className} />
    case Post.Utilisation:
      return <LightbulbOutlinedIcon className={className} />
    case Post.Teletravail:
      return <BoltOutlinedIcon className={className} />
    case Post.DeplacementsClickson:
      return <DeplacementsClicksonIcon className={className} />
    case Post.Restauration:
      return <RestaurationIcon className={className} />
  }
}

export default PostIcon
