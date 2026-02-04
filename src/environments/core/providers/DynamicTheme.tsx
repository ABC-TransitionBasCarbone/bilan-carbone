'use client'

import theme from '@/environments/base/theme/theme'
import clicksonTheme from '@/environments/clickson/theme/theme'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { typeDynamicComponent } from '@/environments/core/utils/dynamicUtils'
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
      defaultComponent={typeDynamicComponent({ component: ThemeProvider, props: { theme, children } })}
      environmentComponents={{
        [Environment.CUT]: typeDynamicComponent({ component: ThemeProvider, props: { theme: cutTheme, children } }),
        [Environment.TILT]: typeDynamicComponent({ component: ThemeProvider, props: { theme: tiltTheme, children } }),
        [Environment.CLICKSON]: typeDynamicComponent({
          component: ThemeProvider,
          props: { theme: clicksonTheme, children },
        }),
      }}
      environment={environment}
    />
  )
}

export default DynamicTheme
