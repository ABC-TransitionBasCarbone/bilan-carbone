'use client'

import { FullStudy } from '@/db/study'
import StudyRights from '@/environments/base/study/StudyRights'
import StudyRightsClickson from '@/environments/clickson/study/StudyRightsClickson'
import StudyRightsCut from '@/environments/cut/study/StudyRightsCut'
import { EmissionFactorImportVersion, Environment, StudyRole } from '@prisma/client'
import { UserSession } from 'next-auth'
import DynamicComponent from '../utils/DynamicComponent'
import { typeDynamicComponent } from '../utils/dynamicUtils'

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
