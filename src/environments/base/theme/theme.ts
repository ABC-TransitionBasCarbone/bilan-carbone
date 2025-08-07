import { Post } from '@/services/posts'
import { createTheme } from '@mui/material/styles'

const base = createTheme({
  cssVariables: true,
  palette: {
    background: {
      default: '#3880ff0d',
      paper: '#ffffff',
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
      dark: '#1d9c5c',
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
    beges1: {
      main: '#f15f57',
      light: '#FEF6F3',
    },
    beges2: {
      main: '#29ba91',
      light: '#F4FAF8',
    },
    beges3: {
      main: '#c89181',
      light: '#FBF8F6',
    },
    beges4: {
      main: '#4a79bd',
      light: '#F3F5FA',
    },
    beges5: {
      main: '#2dabcd',
      light: '#F1F9FB',
    },
    beges6: {
      main: '#57585a',
      light: '#F2F3F4',
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
        containedSecondary: {
          '&:hover': {
            backgroundColor: '#002D7A',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        '& .MuiLinearProgress-bar1': {
          backgroundColor: base.palette.success.main,
        },
        '& .MuiLinearProgress-bar2': {
          backgroundColor: base.palette.grey[200],
        },
        '& .MuiLinearProgress-barColorPrimary': {
          backgroundColor: base.palette.success.main,
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
  },
  custom: {
    palette: {
      error: {
        background: '#f6b8b8',
      },
    },
    box: {
      backgroundColor: base.palette.background.paper,
      color: base.palette.text.primary,
      borderRadius: '1rem',
      borderStyle: 'solid',
      borderWidth: '0.0625rem',
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
    postColors: {
      [Post.Energies]: { light: '#3F5488', dark: '#0C2155' },
      [Post.AutresEmissionsNonEnergetiques]: { light: '#3F5488', dark: '#0C2155' },
      [Post.DechetsDirects]: { light: '#3F5488', dark: '#0C2155' },
      [Post.Immobilisations]: { light: '#3F5488', dark: '#0C2155' },
      [Post.IntrantsBiensEtMatieres]: { light: '#5E97CB', dark: '#2C6498' },
      [Post.IntrantsServices]: { light: '#5E97CB', dark: '#2C6498' },
      [Post.Deplacements]: { light: '#79C7AB', dark: '#469478' },
      [Post.Fret]: { light: '#79C7AB', dark: '#469478' },
      [Post.FinDeVie]: { light: '#FBBC6B', dark: '#C88938' },
      [Post.UtilisationEtDependance]: { light: '#FBBC6B', dark: '#C88938' },
    },
  },
})

export default theme
