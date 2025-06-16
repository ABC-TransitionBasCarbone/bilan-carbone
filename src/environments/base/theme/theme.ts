import { createTheme } from '@mui/material/styles'

const base = createTheme({
  palette: {
    background: {
      default: '#3880ff0d',
    },
    primary: {
      main: '#272768',
      light: '#ebf2ff',
    },
    secondary: {
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
      main: '#94EBBF',
      light: '#E0FBE8',
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
    divider: '#1b5bf51a',
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
    fontFamily: 'gilroy-regular, sans-serif',
    button: {
      fontSize: '1rem',
      textTransform: 'none',
      fontFamily: 'gilroy-regular, sans-serif',
    },
    h1: {
      fontSize: '2.5rem',
      lineHeight: '3.25rem',
      fontWeight: 800,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: '2.75rem',
    },
    h3: {
      fontSize: '1.75rem',
      lineHeight: '2.25rem',
    },
    h4: {
      fontSize: '1.5rem',
      lineHeight: '2rem',
    },
    h5: {
      fontSize: '1.375rem',
      lineHeight: '1.75rem',
    },
    h6: {
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
    },
  },
})

const theme = createTheme(base, {
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
          backgroundColor: base.palette.common.white,
          borderStyle: 'solid',
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
    navbar: {
      organizationToolbar: {
        border: '0.125rem solid rgba(27, 91, 245, 0.1)',
      },
      text: {
        fontFamily: 'gilroy-regular, sans-serif',
        color: '#FFFFFF',
        fontWeight: 600,
        textTransform: 'uppercase',
        fontSize: '1rem',
        '&:hover': {
          color: base.palette.secondary.main,
        },
      },
    },
  },
})

export default theme
