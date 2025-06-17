'use client'

import { ToastProvider } from '@/components/base/ToastProvider'
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
  environment: Environment
}

const Providers = ({ children, environment }: Props) => {
  return (
    <ToastProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
        <DynamicComponent
          defaultComponent={<ThemeProvider theme={theme}>{children}</ThemeProvider>}
          environmentComponents={{ [Environment.CUT]: <ThemeProvider theme={cutTheme}>{children}</ThemeProvider> }}
          forceEnvironment={environment}
        />
      </LocalizationProvider>
    </ToastProvider>
  )
}

export default Providers
