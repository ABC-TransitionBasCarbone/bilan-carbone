'use client'

import theme from '@/environments/base/theme/theme'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import cutTheme from '@/environments/cut/theme/theme'
import { ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Environment } from '@prisma/client'
import 'dayjs/locale/fr'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const Providers = ({ children }: Props) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <DynamicComponent
        defaultComponent={<ThemeProvider theme={theme}>{children}</ThemeProvider>}
        environmentComponents={{ [Environment.CUT]: <ThemeProvider theme={cutTheme}>{children}</ThemeProvider> }}
      />
    </LocalizationProvider>
  )
}

export default Providers
