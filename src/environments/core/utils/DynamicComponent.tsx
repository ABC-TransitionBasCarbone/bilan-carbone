/* eslint-disable @typescript-eslint/no-explicit-any */
import { EnvironmentMode } from '@/constants/environments'
import { isAdvanced, isSimplified } from '@/services/permissions/environment'
import { Environment } from '@prisma/client'
import React from 'react'
import EnvironmentLoader from './EnvironmentLoader'

type AnyComponent = React.ComponentType<any>
type ComponentAndProps<T extends AnyComponent = AnyComponent> = { component: T; props: React.ComponentProps<T> }

type EnvironmentMap = {
  [key in Environment | EnvironmentMode]?: ComponentAndProps
}

interface Props {
  defaultComponent?: ComponentAndProps
  environmentComponents?: EnvironmentMap
  environment: Environment
}

const DynamicComponent = ({ defaultComponent, environmentComponents = {}, environment }: Props) => {
  if (!environment) {
    return <EnvironmentLoader />
  }

  if (environmentComponents[environment]) {
    const { component: Component, props } = environmentComponents[environment]!
    if (Component && props) {
      return <Component {...props} />
    }
  }

  if (isSimplified(environment) && environmentComponents[EnvironmentMode.SIMPLIFIED]) {
    const { component: Component, props } = environmentComponents[EnvironmentMode.SIMPLIFIED]!
    if (Component && props) {
      return <Component {...props} />
    }
  }

  if (isAdvanced(environment) && environmentComponents[EnvironmentMode.ADVANCED]) {
    const { component: Component, props } = environmentComponents[EnvironmentMode.ADVANCED]!
    if (Component && props) {
      return <Component {...props} />
    }
  }

  if (defaultComponent) {
    const { component: Component, props } = defaultComponent!
    if (Component && props) {
      return <Component {...props} />
    }
  }

  return null
}

export default DynamicComponent
