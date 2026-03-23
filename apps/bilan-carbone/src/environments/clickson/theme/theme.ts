import theme from '@/environments/base/theme/theme'
import { Post } from '@/services/posts'
import { createTheme } from '@mui/material/styles'
import { SubPost } from '@repo/db-common/enums'

const clicksonTheme = createTheme(theme, {
  palette: {
    primary: {
      contrastText: '#2C303A',
    },
    success: {
      main: '#94EBBF',
      light: '#63EA9080',
      dark: '#5EDC7A',
    },
  },
  custom: {
    postColors: {
      [Post.EnergiesClickson]: { light: '#1c82b8' },
      [Post.Restauration]: { light: '#f46b5e' },
      [Post.DeplacementsClickson]: { light: '#05d690' },
      [Post.Achats]: { light: '#1ba3ab' },
      [Post.ImmobilisationsClickson]: { light: '#9c27b0' },
    },
    subPostColors: {
      // Energies Clickson
      [SubPost.Electricite]: '#2196c9',
      [SubPost.Combustibles]: '#17648a',
      [SubPost.AutresGaz]: '#5bb6d6',

      // Restauration
      [SubPost.TypesDeRepasServis]: '#fa8c7a',
      [SubPost.DistributeursAutomatiques]: '#c13e2e',
      [SubPost.Fret]: '#f9a89f',
      [SubPost.DechetsOrganiques]: '#f46b5e',

      // Deplacements
      [SubPost.TransportDesEleves]: '#1be6a0',
      [SubPost.TransportDuPersonnel]: '#048c5e',
      [SubPost.VoyagesScolaires]: '#5fffd0',

      // Achats
      [SubPost.Fournitures]: '#23c6d6',
      [SubPost.ProduitsChimiques]: '#13777c',
      [SubPost.EquipementsDeSport]: '#6fd6db',
      [SubPost.DechetsRecyclables]: '#1ba3ab',
      [SubPost.OrduresMenageresResiduelles]: '#0e5a5e',

      // Immobilisations
      [SubPost.Construction]: '#b85fd6',
      [SubPost.Renovation]: '#6d1b7b',
      [SubPost.EquipementsInformatiqueAudiovisuel]: '#e1b6f7',
      [SubPost.EquipementsDivers]: '#9c27b0',
    },
  },
})

export default clicksonTheme
