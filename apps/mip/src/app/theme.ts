import { createTheme } from '@mui/material/styles'
import { globalTheme } from '@repo/css'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#272768',
    },
    secondary: {
      main: '#346fef',
    },
  },
  typography: globalTheme.typography,
})
