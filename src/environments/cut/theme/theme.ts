import { createTheme } from '@mui/material/styles'

const base = createTheme({
  palette: {
    primary: {
      main: '#63EA90',
      light: '#D0F8DE',
      contrastText: '#2C303A',
    },
    secondary: {
      main: '#63EA90',
    },
    grey: {
      '500': '#2C303A',
    },
    success: {
      main: '#94EBBF',
    },
    error: {
      main: '#FF4052',
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
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
  ],
  typography: {
    fontFamily: '"Gilroy-Regular", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontFamily: '"Gilroy-Regular", sans-serif',
    },
  },
})

const cutTheme = createTheme(base, {
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1360,
      xl: 1536,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
        },
        outlined: {
          borderColor: base.palette.grey['500'],
          backgroundColor: base.palette.common.white,
          color: base.palette.primary.contrastText,
          '&:hover': {
            backgroundColor: base.palette.grey['50'],
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: base.palette.grey[200],
          borderRadius: 4,
        },
        bar: {
          borderRadius: 4,
          backgroundColor: base.palette.primary.main,
        },
      },
    },
  },
  custom: {
    box: {
      backgroundColor: base.palette.background.paper,
      color: base.palette.text.primary,
      borderRadius: '1rem',
      borderStyle: 'solid',
      borderWidth: '0.0125rem',
      borderColor: base.palette.grey[300],
      padding: '1rem',
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
    roles: {
      validator: '#ffc966',
      editor: '#89d7b0',
      reader: '#eae5e8',
      contributor: '#c4d1dd',
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
