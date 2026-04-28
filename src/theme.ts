// Global theme for the monorepo
// Place shared theme config here for all apps/packages
// Gilroy font family is enforced globally

import { createTheme } from '@mui/material/styles'

const globalTheme = createTheme({
    cssVariables: true,
    typography: {
        fontFamily: 'gilroy-regular, sans-serif',
        button: {
            fontFamily: 'gilroy-regular, sans-serif',
        },
    },
    // Add other shared palette, breakpoints, or component overrides as needed
})

export default globalTheme
