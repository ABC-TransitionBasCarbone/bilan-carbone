'use client'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './theme'
import { ReactNode } from 'react'

export const MuiThemeProvider = ({ children }: { children: ReactNode }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}