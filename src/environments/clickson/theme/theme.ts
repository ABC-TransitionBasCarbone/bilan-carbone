import theme from '@/environments/base/theme/theme'
import { Post } from '@/services/posts'
import { createTheme } from '@mui/material/styles'
import { SubPost } from '@prisma/client'

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
      [SubPost.Electricite]: '#1c82b8',
      [SubPost.Combustibles]: '#1c82b8',
      [SubPost.AutresGaz]: '#1c82b8',

      // Restauration
      [SubPost.TypesDeRepasServis]: '#f46b5e',
      [SubPost.DistributeursAutomatiques]: '#f46b5e',
      [SubPost.Fret]: '#f46b5e',
      [SubPost.DechetsOrganiques]: '#f46b5e',

      // Deplacements
      [SubPost.TransportDesEleves]: '#05d690',
      [SubPost.TransportDuPersonnel]: '#05d690',
      [SubPost.VoyagesScolaires]: '#05d690',

      // Achats
      [SubPost.Fournitures]: '#1ba3ab',
      [SubPost.ProduitsChimiques]: '#1ba3ab',
      [SubPost.EquipementsDeSport]: '#1ba3ab',
      [SubPost.DechetsRecyclables]: '#1ba3ab',
      [SubPost.OrduresMenageresResiduelles]: '#1ba3ab',

      // Immobilisations
      [SubPost.Construction]: '#9c27b0',
      [SubPost.Renovation]: '#9c27b0',
      [SubPost.EquipementsInformatiqueAudiovisuel]: '#9c27b0',
      [SubPost.EquipementsDivers]: '#9c27b0',
    },
  },
})

export default clicksonTheme
