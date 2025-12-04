import theme from '@/environments/base/theme/theme'
import { Post } from '@/services/posts'
import { createTheme } from '@mui/material/styles'

const clicksonTheme = createTheme(theme, {
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
        // outlined: {
        //   borderColor: base.palette.grey['500'],
        //   backgroundColor: base.palette.common.white,
        //   color: base.palette.primary.contrastText,
        //   '&:hover': {
        //     backgroundColor: base.palette.grey['50'],
        //   },
        // },
        contained: {
          color: '#F4F7F9',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          // backgroundColor: base.palette.grey[200],
          borderRadius: 4,
        },
        bar: {
          borderRadius: 4,
          // backgroundColor: base.palette.primary.main,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          // color: base.palette.text.primary,
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
      // backgroundColor: base.palette.background.paper,
      // color: base.palette.text.primary,
      borderRadius: '1rem',
      borderStyle: 'solid',
      borderWidth: '0.0125rem',
      // borderColor: base.palette.grey[300],
      padding: '1rem',
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

      // CLICKSON
      [Post.Achats]: { light: '#79C7AB', dark: '#469478' },
      [Post.Restauration]: { light: '#79C7AB', dark: '#469478' },
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

export default clicksonTheme
