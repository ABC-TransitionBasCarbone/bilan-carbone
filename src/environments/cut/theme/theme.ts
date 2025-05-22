import { createTheme } from '@mui/material/styles'

const base = createTheme({
  palette: {
    primary: {
      main: '#63EA90',
      light: '#D0F8DE',
      contrastText: '#2C303A',
    },
    secondary: {
      main: '#1D1D1B'
    },
    grey: {

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
      paper: '#FBFCFC',
    },
  },
  shadows: [
    'none', 'none', 'none', 'none', 'none',
    'none', 'none', 'none', 'none', 'none',
    'none', 'none', 'none', 'none', 'none',
    'none', 'none', 'none', 'none', 'none',
    'none', 'none', 'none', 'none', 'none'
  ],
  typography: {
    fontFamily: '"Gilroy-Regular", sans-serif',
    button: {
      textTransform: 'none',
      fontFamily: '"Gilroy-Regular", sans-serif',
    }
  }
})

const cutTheme = createTheme(base, {
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1360,
      xl: 1536
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
        },
        outlined: {
          backgroundColor: base.palette.common.white,
        }
      }
    }
  },
  custom: {
    box: {
      backgroundColor: base.palette.background.paper,
      color: base.palette.text.primary,
      borderRadius: '1rem',
      borderStyle: 'solid',
      borderWidth: '0.0125rem',
      borderColor: base.palette.grey[300],
      padding: '1rem'
    },
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
        fontSize: '1rem',
      },
    },
  },
})

export default cutTheme
