import { Theme } from '@mui/material/styles'

declare module '@mui/material/styles' {
    interface Theme {
        custom: {
            postColors: {
                darkBlue: { dark: string; light: string }
                green: { dark: string; light: string }
                blue: { dark: string; light: string }
                orange: { dark: string; light: string }
            }
        }
    }

    interface ThemeOptions {
        custom?: {
            postColors?: {
                darkBlue?: { dark: string; light: string }
                green?: { dark: string; light: string }
                blue?: { dark: string; light: string }
                orange?: { dark: string; light: string }
            }
        }
    }
}