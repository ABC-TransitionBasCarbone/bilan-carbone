// Global theme for the monorepo
// Place shared theme config here for all apps/packages
// Gilroy font family is enforced globally

import { createTheme } from '@mui/material/styles'

const globalTheme = createTheme({
  cssVariables: true,
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

export default globalTheme
