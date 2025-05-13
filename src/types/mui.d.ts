import '@mui/material/styles'

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
      }
    }
  }
}
