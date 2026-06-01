import { globalTheme } from '@abc-transitionbascarbone/css'
import { createTheme } from '@mui/material/styles'

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
