'use client'

import { EnvironmentMode } from '@/constants/environments'
import { isAdvanced, isSimplified } from '@/services/permissions/environment'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { Environment } from '@prisma/client'
import { ReactNode } from 'react'
import EnvironmentLoader from './EnvironmentLoader'

type EnvironmentMap = {
  [key in Environment]?: ReactNode
} & { [EnvironmentMode.SIMPLIFIED]?: ReactNode; [EnvironmentMode.ADVANCED]?: ReactNode }

interface Props {
  defaultComponent?: ReactNode
  environmentComponents?: EnvironmentMap
  forceEnvironment?: Environment
}

const DynamicComponent = ({ defaultComponent, environmentComponents = {}, forceEnvironment }: Props) => {
  const { environment } = useAppEnvironmentStore()

  const environmentToUse = forceEnvironment || environment

  if (!environmentToUse) {
    return <EnvironmentLoader />
  }

  if (environmentComponents[environmentToUse]) {
    return environmentComponents[environmentToUse]
  }

  if (isSimplified(environmentToUse) && environmentComponents[EnvironmentMode.SIMPLIFIED]) {
    return environmentComponents[EnvironmentMode.SIMPLIFIED]
  }

  if (isAdvanced(environmentToUse) && environmentComponents[EnvironmentMode.ADVANCED]) {
    return environmentComponents[EnvironmentMode.ADVANCED]
  }

  return defaultComponent
}

export default DynamicComponent
