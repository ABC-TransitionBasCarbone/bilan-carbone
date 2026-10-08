'use client'

import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { CourseEnvironment } from '@/types/environment'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import {
  courseEnvironments,
  EnvironmentMode,
  fallBackEnvironment,
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
  forceEnvironment?: Environment
}

const DynamicComponent = ({ defaultComponent, environmentComponents = {}, forceEnvironment }: Props) => {
  const { environment } = useAppEnvironmentStore()

  let environmentToUse
  if (
    environment &&
    courseEnvironments.includes(environment) &&
    !(Object.keys(environmentComponents) as Environment[]).includes(environment)
  ) {
    environmentToUse = fallBackEnvironment[environment as CourseEnvironment]
  }

  environmentToUse = forceEnvironment || environmentToUse || environment

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
