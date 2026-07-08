import { Post } from '@abc-transitionbascarbone/utils/charts'
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
import { AchatsIcon } from './achats'
import { DeplacementsClicksonIcon } from './deplacementsClickson'
import { EnergieClicksonIcon } from './energieClickson'
import { ImmobilisationsClicksonIcon } from './immobilisationsClickson'
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
    case Post.Energies:
    case Post.EnergiesSimplified:
      return <EnergiesIcon className={className} />
    case Post.Immobilisations:
    case Post.LocauxSimplified:
      return <ImmobilisationsIcon className={className} />
    case Post.UtilisationEtDependance:
      return <UtilisationEtDependanceIcon className={className} />
    case Post.FinDeVie:
    case Post.FinDeVieSimplified:
      return <FinDeVieIcon className={className} />
    case Post.IntrantsBiensEtMatieres:
      return <IntrantsBiensEtMatieresIcon className={className} />
    case Post.Fret:
      return <FretIcon className={className} />
    case Post.IntrantsServices:
    case Post.ServiceEtNumeriqueSimplified:
      return <IntrantsServicesIcon className={className} />
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
    case Post.DechetsSimplified:
      return <DechetsIcon className={className} />
    case Post.BilletterieEtCommunication:
      return <BilletterieEtCommunicationIcon className={className} />
    case Post.IntrantsBiensEtMatieresTiltSimplified:
      return <IntrantsBiensEtMatieresIcon className={className} />
    case Post.Alimentation:
    case Post.AlimentationSimplified:
      return <LocalPizzaOutlinedIcon className={className} />
    case Post.EquipementsEtImmobilisations:
    case Post.EquipementsEtImmobilisationsSimplified:
      return <ComputerOutlinedIcon className={className} />
    case Post.DeplacementsDePersonne:
    case Post.DeplacementsDePersonneSimplified:
      return <TrainOutlinedIcon className={className} />
    case Post.TransportDeMarchandises:
    case Post.TransportDeMarchandisesSimplified:
      return <LocalShippingOutlinedIcon className={className} />
    case Post.ConstructionDesLocaux:
      return <MapsHomeWorkOutlinedIcon className={className} />
    case Post.FroidEtClim:
    case Post.FroidEtClimSimplified:
      return <AcUnitOutlinedIcon className={className} />
    case Post.AutresEmissions:
      return <FilterDramaOutlinedIcon className={className} />
    case Post.Utilisation:
    case Post.UtilisationSimplified:
      return <LightbulbOutlinedIcon className={className} />
    case Post.Teletravail:
    case Post.TeletravailSimplified:
      return <BoltOutlinedIcon className={className} />
    case Post.EnergiesClickson:
      return <EnergieClicksonIcon className={className} />
    case Post.DeplacementsClickson:
      return <DeplacementsClicksonIcon className={className} />
    case Post.Restauration:
      return <RestaurationIcon className={className} />
    case Post.Achats:
      return <AchatsIcon className={className} />
    case Post.ImmobilisationsClickson:
      return <ImmobilisationsClicksonIcon className={className} />
  }
}

export default PostIcon
