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
      defaultComponent={{ component: ThemeProvider, props: { theme, children } }}
      environmentComponents={{
        [Environment.CUT]: { component: ThemeProvider, props: { theme: cutTheme, children } },
        [Environment.TILT]: { component: ThemeProvider, props: { theme: tiltTheme, children } },
        [Environment.CLICKSON]: { component: ThemeProvider, props: { theme: clicksonTheme, children } },
      }}
      environment={environment}
    />
  )
}

export default DynamicTheme
