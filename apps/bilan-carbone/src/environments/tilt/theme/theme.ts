import theme from '@/environments/base/theme/theme'
import { TiltAdvancedPost, TiltSimplifiedPost } from '@/services/posts'
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
      [TiltAdvancedPost.IntrantsBiensEtMatieresTilt]: {
        light: '#5E97CB',
        dark: '#2C6498',
        customTitleColor: '#ffffff',
      },
      [TiltAdvancedPost.Alimentation]: { light: '#5E97CB', dark: '#2C6498', customTitleColor: '#ffffff' },
      [TiltAdvancedPost.IntrantsServices]: { light: '#5E97CB', dark: '#2C6498', customTitleColor: '#ffffff' },
      [TiltAdvancedPost.EquipementsEtImmobilisations]: {
        light: '#5E97CB',
        dark: '#2C6498',
        customTitleColor: '#ffffff',
      },
      [TiltAdvancedPost.DeplacementsDePersonne]: { light: '#79C7AB', dark: '#469478', customTitleColor: '#ffffff' },
      [TiltAdvancedPost.TransportDeMarchandises]: { light: '#79C7AB', dark: '#469478', customTitleColor: '#ffffff' },
      [TiltAdvancedPost.ConstructionDesLocaux]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltAdvancedPost.Energies]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltAdvancedPost.DechetsDirects]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltAdvancedPost.FroidEtClim]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltAdvancedPost.AutresEmissions]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltAdvancedPost.Utilisation]: { light: '#FBBC6B', dark: '#C88938' },
      [TiltAdvancedPost.FinDeVie]: { light: '#FBBC6B', dark: '#C88938' },
      [TiltAdvancedPost.Teletravail]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltSimplifiedPost.LocauxSimplified]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltSimplifiedPost.EnergiesSimplified]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltSimplifiedPost.DechetsSimplified]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltSimplifiedPost.FroidEtClimSimplified]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
      [TiltSimplifiedPost.DeplacementsDePersonneSimplified]: {
        light: '#79C7AB',
        dark: '#469478',
        customTitleColor: '#ffffff',
      },
      [TiltSimplifiedPost.TransportDeMarchandisesSimplified]: {
        light: '#79C7AB',
        dark: '#469478',
        customTitleColor: '#ffffff',
      },
      [TiltSimplifiedPost.IntrantsBiensEtMatieresTiltSimplified]: {
        light: '#5E97CB',
        dark: '#2C6498',
        customTitleColor: '#ffffff',
      },
      [TiltSimplifiedPost.AlimentationSimplified]: { light: '#5E97CB', dark: '#2C6498', customTitleColor: '#ffffff' },
      [TiltSimplifiedPost.ServiceEtNumeriqueSimplified]: {
        light: '#5E97CB',
        dark: '#2C6498',
        customTitleColor: '#ffffff',
      },
      [TiltSimplifiedPost.EquipementsEtImmobilisationsSimplified]: {
        light: '#5E97CB',
        dark: '#2C6498',
        customTitleColor: '#ffffff',
      },
      [TiltSimplifiedPost.UtilisationSimplified]: { light: '#FBBC6B', dark: '#C88938' },
      [TiltSimplifiedPost.FinDeVieSimplified]: { light: '#FBBC6B', dark: '#C88938' },
      [TiltSimplifiedPost.TeletravailSimplified]: { light: '#3F5488', dark: '#0C2155', customTitleColor: '#ffffff' },
    },
  },
})

export default tiltTheme
