import { Post } from '@/services/posts'
import { createTheme } from '@mui/material/styles'

const base = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: '#63EA90',
      light: '#E0FBE8',
      contrastText: '#2C303A',
    },
    secondary: {
      light: '#F3FBF7',
      main: '#63EA90',
    },
    grey: {
      50: '#e9eff9',
      100: '#dbe5f6',
      200: '#eae5e8',
      300: '#c6d8f5',
      400: '#9fbff3',
      500: '#2C303A',
      600: '#080212',
      800: '#040109',
      900: '#020105',
    },
    success: {
      main: '#94EBBF',
      light: '#63EA9080',
      dark: '#5EDC7A',
    },
    error: {
      main: '#FF4052',
      light: '#FFCCCC',
      dark: '#F99',
    },
    warning: {
      main: '#fc8514',
    },
    info: {
      main: '#B0B8C4',
      light: '#E5E7EB',
      dark: '#9CA3AF',
    },
    background: {
      default: '#FBFCFC',
      paper: '#FBFCFC',
    },
    text: {
      primary: '#2C303A',
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
    fontFamily: 'Gilroy-Regular, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontFamily: 'Gilroy-Regular, sans-serif',
    },
    h4: {
      fontFamily: 'Gilroy-Regular, sans-serif',
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: '1.2rem',
      letterSpacing: '0%',
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
        contained: {
          color: '#F4F7F9',
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
    MuiAlert: {
      styleOverrides: {
        root: {
          color: base.palette.text.primary,
          fontFamily: 'Gilroy-Regular, sans-serif',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& input': {
            '&:-webkit-autofill': {
              WebkitBoxShadow: '0 0 0 1000px #ffffff inset',
              WebkitTextFillColor: 'inherit',
            },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '1rem',
          lineHeight: 'normal',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '1rem !important',
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
      [Post.Fonctionnement]: { light: '#FF8145' },
      [Post.MobiliteSpectateurs]: { light: '#FEBC0C' },
      [Post.TourneesAvantPremieres]: { light: '#3CCDB4' },
      [Post.Dechets]: { light: '#9A61FA' },
      [Post.ConfiseriesEtBoissons]: { light: '#FF49A2' },
      [Post.BilletterieEtCommunication]: { light: '#FF4052' },
      [Post.SallesEtCabines]: { light: '#6AA8FF' },
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
    publicContainer: {
      background: '#E0FBE8',
    },
  },
})

export default cutTheme
