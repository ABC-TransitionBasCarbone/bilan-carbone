import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { Environment } from '@prisma/client'
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

  return environmentComponents[environment || Environment.BC] || defaultComponent
}

export default DynamicComponent
