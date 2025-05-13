import '@mui/material/styles'
import { CSSProperties } from 'react'

declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      postColors: {
        functioning: { light: string },
        mobility: { light: string },
        tour: { light: string },
        candyStore: { light: string },
        garbage: { light: string },
        ticketOffice: { light: string },
        movieTheater: { light: string },
      },
      navbar: {
        text: {
          color: string,
          fontWeight: number,
          textTransform: CSSProperties['textTransform'],
          fontSize: string,
        },
      }
    }
  }

  interface ThemeOptions {
    custom?: {
      postColors?: {
        functioning: { light: string },
        mobility: { light: string },
        tour: { light: string },
        candyStore: { light: string },
        garbage: { light: string },
        ticketOffice: { light: string },
        movieTheater: { light: string },
      },
      navbar: {
        text: {
          color: string,
          fontWeight: number,
          textTransform: CSSProperties['textTransform'],
          fontSize: string,
        },
      }
    }
  }
}
