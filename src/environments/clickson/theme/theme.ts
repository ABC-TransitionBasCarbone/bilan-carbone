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
      [SubPost.Electricite]: '#2196c9',         // plus clair
      [SubPost.Combustibles]: '#17648a',        // plus foncé
      [SubPost.AutresGaz]: '#5bb6d6',           // variante pastel

      // Restauration
      [SubPost.TypesDeRepasServis]: '#fa8c7a',  // plus clair
      [SubPost.DistributeursAutomatiques]: '#c13e2e', // plus foncé
      [SubPost.Fret]: '#f9a89f',                // pastel
      [SubPost.DechetsOrganiques]: '#f46b5e',   // couleur principale

      // Deplacements
      [SubPost.TransportDesEleves]: '#1be6a0',  // plus clair
      [SubPost.TransportDuPersonnel]: '#048c5e',// plus foncé
      [SubPost.VoyagesScolaires]: '#5fffd0',    // pastel

      // Achats
      [SubPost.Fournitures]: '#23c6d6',         // plus clair
      [SubPost.ProduitsChimiques]: '#13777c',   // plus foncé
      [SubPost.EquipementsDeSport]: '#6fd6db',  // pastel
      [SubPost.DechetsRecyclables]: '#1ba3ab',  // couleur principale
      [SubPost.OrduresMenageresResiduelles]: '#0e5a5e', // très foncé

      // Immobilisations
      [SubPost.Construction]: '#b85fd6',        // plus clair
      [SubPost.Renovation]: '#6d1b7b',          // plus foncé
      [SubPost.EquipementsInformatiqueAudiovisuel]: '#e1b6f7', // pastel
      [SubPost.EquipementsDivers]: '#9c27b0',   // couleur principale
    },
  },
})

export default clicksonTheme
