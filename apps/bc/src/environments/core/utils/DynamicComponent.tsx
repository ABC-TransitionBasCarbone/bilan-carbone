'use client'

import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import {
  EnvironmentMode,
  getEnvironmentHandlingGenericEnvs,
  isAdvanced,
  isSimplified,
} from '@abc-transitionbascarbone/common/utils/environments'
import { ReactNode } from 'react'
import EnvironmentLoader from './EnvironmentLoader'

type EnvironmentMap = {
  [key in Environment]?: ReactNode
} & { [EnvironmentMode.SIMPLIFIED]?: ReactNode; [EnvironmentMode.ADVANCED]?: ReactNode }

interface Props {
  defaultComponent?: ReactNode
  environmentComponents?: EnvironmentMap
  forceEnvironment?: Environment // is used when the current env is undefined or not the right one
  useGenericEnv?: boolean // is used if we do not want to use generic environment for course but the course env. If force environment is a course one, we have to use both forceEnv + useGenericEnv to false
}

const DynamicComponent = ({
  defaultComponent,
  environmentComponents = {},
  forceEnvironment,
  useGenericEnv = true,
}: Props) => {
  const { environment } = useAppEnvironmentStore()

  const genericEnv = getEnvironmentHandlingGenericEnvs(environment)
  const hasGenericEnvAssociated = useGenericEnv && genericEnv !== environment
  const environmentToUse =
    (useGenericEnv && hasGenericEnvAssociated ? genericEnv : forceEnvironment) || forceEnvironment

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
