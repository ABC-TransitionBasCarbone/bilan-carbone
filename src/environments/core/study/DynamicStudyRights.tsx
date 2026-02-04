'use client'

import { FullStudy } from '@/db/study'
import { EmissionFactorImportVersion, Environment, StudyRole } from '@prisma/client'
import { UserSession } from 'next-auth'
import dynamic from 'next/dynamic'
import DynamicComponent from '../utils/DynamicComponent'
import { typeDynamicComponent } from '../utils/dynamicUtils'

const StudyRightsClickson = dynamic(() => import('@/environments/clickson/study/StudyRightsClickson'))
const StudyRightsCut = dynamic(() => import('@/environments/cut/study/StudyRightsCut'))
const StudyRights = dynamic(() => import('@/environments/base/study/StudyRights'))

interface Props {
  user: UserSession
  study: FullStudy
  editionDisabled: boolean
  userRoleOnStudy: StudyRole
  emissionFactorSources: EmissionFactorImportVersion[]
}

const DynamicStudyRights = ({ user, study, editionDisabled, userRoleOnStudy, emissionFactorSources }: Props) => {
  return (
    <DynamicComponent
      environment={study.organizationVersion.environment}
      defaultComponent={typeDynamicComponent({
        component: StudyRights,
        props: {
          user,
          study,
          editionDisabled,
          userRoleOnStudy,
          emissionFactorSources,
        },
      })}
      environmentComponents={{
        [Environment.CUT]: typeDynamicComponent({ component: StudyRightsCut, props: { study } }),
        [Environment.CLICKSON]: typeDynamicComponent({
          component: StudyRightsClickson,
          props: {
            study,
            editionDisabled,
            emissionFactorSources,
            user,
          },
        }),
      }}
    />
  )
}

export default DynamicStudyRights
