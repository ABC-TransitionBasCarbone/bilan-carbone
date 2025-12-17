import theme from '@/environments/base/theme/theme'
import { Post } from '@/services/posts'
import { createTheme } from '@mui/material/styles'

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
  },
})

export default clicksonTheme
