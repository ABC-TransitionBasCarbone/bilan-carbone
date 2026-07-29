import { globalTheme } from '@abc-transitionbascarbone/css'
import { createTheme } from '@mui/material/styles'

const baseTheme = createTheme(globalTheme, {
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: {
      main: '#272768',
      light: '#ebf2ff',
    },
    secondary: {
      main: '#346fef',
    },
  },
  typography: globalTheme.typography,
})

export const theme = createTheme(baseTheme, {
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--mip-category-dt-bg': 'color-mix(in srgb, var(--primary-100) 86%, var(--white))',
          '--mip-category-dt-text': 'var(--primary-600)',
          '--mip-category-transport-bg': 'color-mix(in srgb, var(--info) 14%, var(--white))',
          '--mip-category-transport-text': 'var(--info)',
          '--mip-category-alimentation-bg': 'color-mix(in srgb, var(--warning) 22%, var(--white))',
          '--mip-category-alimentation-text': 'var(--warning)',
          '--mip-category-divers-bg': 'color-mix(in srgb, var(--error-50) 20%, var(--white))',
          '--mip-category-divers-text': 'var(--error-100)',
          '--mip-category-logement-bg': 'color-mix(in srgb, var(--success-50) 30%, var(--white))',
          '--mip-category-logement-text': 'var(--success-100)',
        },
      },
    },
  },
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
