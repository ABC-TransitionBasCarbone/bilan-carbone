import { Environment, useAppEnvironmentStore } from '@/store/AppEnvironment'
import { ReactNode } from 'react'

type EnvironmentMap = {
  [key in Environment]?: ReactNode
}

interface Props {
  defaultComponent: ReactNode
  environmentComponents?: EnvironmentMap
}

const DynamicComponent = ({ defaultComponent, environmentComponents = {} }: Props) => {
  const { environment } = useAppEnvironmentStore()

  return environmentComponents[environment] || defaultComponent
}

export default DynamicComponent
