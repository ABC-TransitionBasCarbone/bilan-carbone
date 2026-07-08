import { globalTheme } from '@abc-transitionbascarbone/css'
import { createTheme } from '@mui/material/styles'

const baseTheme = createTheme(globalTheme, {
  cssVariables: true,
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

export const theme = createTheme(baseTheme, {
  custom: {
    box: {
      backgroundColor: baseTheme.palette.background.paper,
      color: baseTheme.palette.text.primary,
      borderRadius: '1rem',
      borderStyle: 'solid',
      borderWidth: '0.0125rem',
      borderColor: baseTheme.palette.grey[300],
      padding: '1rem',
    },
  },
})
