import theme from '@/environments/base/theme/theme'
import { TiltPost } from '@/services/posts'
import { createTheme } from '@mui/material/styles'

const tiltTheme = createTheme(theme, {
  palette: {
    primary: {
      contrastText: '#2C303A',
    },
  },
  cssVariables: true,
  custom: {
    postColors: {
      [TiltPost.IntrantsBiensEtMatieresTilt]: { light: '#5E97CB', dark: '#2C6498', customTitleColor: '#ffffff' },
      [TiltPost.Alimentation]: { light: '#5E97CB', dark: '#2C6498', customTitleColor: '#ffffff' },
      [TiltPost.IntrantsServices]: { light: '#5E97CB', dark: '#2C6498', customTitleColor: '#ffffff' },
      [TiltPost.EquipementsEtImmobilisations]: { light: '#5E97CB', dark: '#2C6498', customTitleColor: '#ffffff' },
      [TiltPost.DeplacementsDePersonne]: { light: '#79C7AB', dark: '#469478', customTitleColor: '#ffffff' },
      [TiltPost.TransportDeMarchandises]: { light: '#79C7AB', dark: '#469478', customTitleColor: '#ffffff' },
      [TiltPost.ConstructionDesLocaux]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltPost.Energies]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltPost.DechetsDirects]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltPost.FroidEtClim]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltPost.AutresEmissions]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltPost.Utilisation]: { light: '#FBBC6B', dark: '#C88938' },
      [TiltPost.FinDeVie]: { light: '#FBBC6B', dark: '#C88938' },
      [TiltPost.Teletravail]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
    },
  },
})

export default tiltTheme
