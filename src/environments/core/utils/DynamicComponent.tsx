import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { Environment } from '@prisma/client'
import { ReactNode } from 'react'

type EnvironmentMap = {
  [key in Environment]?: ReactNode
}

interface Props {
  defaultComponent: ReactNode
  environmentComponents?: EnvironmentMap
  forceEnvironment?: Environment
}

const DynamicComponent = ({ defaultComponent, environmentComponents = {}, forceEnvironment }: Props) => {
  const { environment } = useAppEnvironmentStore()

  const environmentToUse = forceEnvironment || environment

  return environmentComponents[environmentToUse || Environment.BC] || defaultComponent
}

export default DynamicComponent
