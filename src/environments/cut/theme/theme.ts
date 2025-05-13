import { createTheme } from '@mui/material/styles'

const cutTheme = createTheme({
  palette: {
    primary: {
      main: '#63EA90',
      contrastText: '#2C303A'
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
  typography: {
    fontFamily: '"Gilroy", sans-serif'
  },
  custom: {
    postColors: {
      functioning: { light: '#FF8145' },
      mobility: { light: '#FEBC0C' },
      tour: { light: '#3CCDB4' },
      candyStore: { light: '#FF49A2' },
      garbage: { light: '#9A61FA' },
      ticketOffice: { light: '#FF4052' },
      movieTheater: { light: '#6AA8FF' },
    },
    navbar: {
      text: {
        color: '#000000',
        fontWeight: 600,
        textTransform: 'uppercase',
        fontSize: '1rem'
      },
    }
  },
})

export default cutTheme
