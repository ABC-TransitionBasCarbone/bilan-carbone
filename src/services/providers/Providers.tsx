'use client'

import { createTheme, THEME_ID, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fr'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const materialTheme = createTheme({
  palette: {
    primary: {
      main: '#004d94',
    },
  },
})

const Providers = ({ children }: Props) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <ThemeProvider theme={{ [THEME_ID]: materialTheme }}>{children}</ThemeProvider>
    </LocalizationProvider>
  )
}

export default Providers
