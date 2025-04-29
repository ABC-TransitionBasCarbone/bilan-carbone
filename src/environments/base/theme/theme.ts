import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#346fef',
    },
    grey: {
      50: '#e9eff9',
      100: '#dbe5f6',
      200: '#eae5e8',
      300: '#c6d8f5',
      400: '#9fbff3',
      500: '#0a0317',
      600: '#080212',
      800: '#040109',
      900: '#020105',
    },
    success: {
      main: '#1d9c5c',
    },
    error: {
      light: '#e04949',
      main: '#cd2323',
      dark: '#641111',
    },
    warning: {
      main: '#fc8514',
    },
    info: {
      main: '#272768',
    },
    background: {
      default: '#ebf2ff',
      paper: '#e9eff9',
    },
  },
  custom: {
    postColors: {
      darkBlue: {
        dark: '#0c2155',
        light: '#3f5488',
      },
      green: {
        dark: '#469478',
        light: '#79c7ab',
      },
      blue: {
        dark: '#2c6498',
        light: '#5e97cb',
      },
      orange: {
        dark: '#c88938',
        light: '#fbbc6b',
      },
    },
  },
})

export default theme
