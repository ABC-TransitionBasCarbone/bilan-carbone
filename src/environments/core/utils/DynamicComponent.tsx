import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { Environment } from '@prisma/client'
import { ReactNode } from 'react'
import EnvironmentLoader from './EnvironmentLoader'

type EnvironmentMap = {
  [key in Environment]?: ReactNode
}

interface Props {
  defaultComponent?: ReactNode
  environmentComponents?: EnvironmentMap
  forceEnvironment?: Environment
}

const DynamicComponent = ({ defaultComponent, environmentComponents = {}, forceEnvironment }: Props) => {
  const { environment } = useAppEnvironmentStore()

  const environmentToUse = forceEnvironment || environment

  return environmentToUse ? environmentComponents[environmentToUse] || defaultComponent : <EnvironmentLoader />
}

export default DynamicComponent
