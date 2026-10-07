'use client'
import { theme } from '@/app/theme'
import { ThemeProvider } from '@mui/material/styles'
import { ReactNode } from 'react'

export const MuiThemeProvider = ({ children }: { children: ReactNode }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
