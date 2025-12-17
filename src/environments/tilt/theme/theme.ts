import theme from '@/environments/base/theme/theme'
import { TiltPost } from '@/services/posts'
import { createTheme } from '@mui/material/styles'

const tiltTheme = createTheme(theme, {
  cssVariables: true,
  custom: {
    postColors: {
      [TiltPost.IntrantsBiensEtMatieresTilt]: { light: '#5E97CB', dark: '#2C6498' },
      [TiltPost.Alimentation]: { light: '#5E97CB', dark: '#2C6498' },
      [TiltPost.IntrantsServices]: { light: '#5E97CB', dark: '#2C6498' },
      [TiltPost.EquipementsEtImmobilisations]: { light: '#5E97CB', dark: '#2C6498' },
      [TiltPost.DeplacementsDePersonne]: { light: '#79C7AB', dark: '#469478' },
      [TiltPost.TransportDeMarchandises]: { light: '#79C7AB', dark: '#469478' },
      [TiltPost.ConstructionDesLocaux]: { light: '#3F5488', dark: '#0C2155' },
      [TiltPost.Energies]: { light: '#3F5488', dark: '#0C2155' },
      [TiltPost.Dechets]: { light: '#3F5488', dark: '#0C2155' },
      [TiltPost.FroidEtClim]: { light: '#3F5488', dark: '#0C2155' },
      [TiltPost.AutresEmissions]: { light: '#3F5488', dark: '#0C2155' },
      [TiltPost.Utilisation]: { light: '#FBBC6B', dark: '#C88938' },
      [TiltPost.FinDeVie]: { light: '#FBBC6B', dark: '#C88938' },
      [TiltPost.Teletravail]: { light: '#3F5488', dark: '#0C2155' },
    },
  },
})

export default tiltTheme
