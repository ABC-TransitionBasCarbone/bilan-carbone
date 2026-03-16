'use client'

import theme from '@/environments/base/theme/theme'
import clicksonTheme from '@/environments/clickson/theme/theme'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import cutTheme from '@/environments/cut/theme/theme'
import tiltTheme from '@/environments/tilt/theme/theme'
import { ThemeProvider } from '@mui/material'
import { Environment } from '@prisma/client'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  environment: Environment
}

const DynamicTheme = ({ children, environment }: Props) => {
  return (
    <DynamicComponent
      defaultComponent={<ThemeProvider theme={theme}>{children}</ThemeProvider>}
      environmentComponents={{
        [Environment.CUT]: <ThemeProvider theme={cutTheme}>{children}</ThemeProvider>,
        [Environment.TILT]: <ThemeProvider theme={tiltTheme}>{children}</ThemeProvider>,
        [Environment.CLICKSON]: <ThemeProvider theme={clicksonTheme}>{children}</ThemeProvider>,
      }}
      forceEnvironment={environment}
    />
  )
}

export default DynamicTheme
