'use client'

import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import getComponent, { ComponentKey } from './getComponent'

interface Props {
  componentPath: ComponentKey
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

const DynamicComponent = ({ componentPath, ...props }: Props) => {
  const { environment } = useAppEnvironmentStore()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = getComponent(componentPath, environment) as React.ComponentType<any>

  return <Component {...props} />
}

export default DynamicComponent
