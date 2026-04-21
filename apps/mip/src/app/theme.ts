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
  typography: {
    fontFamily: 'gilroy-regular, sans-serif',
    button: {
      fontSize: '1rem',
      textTransform: 'none',
      fontFamily: 'gilroy-regular, sans-serif',
    },
  },
})
