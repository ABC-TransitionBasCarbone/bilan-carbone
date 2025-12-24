'use client'

import { FullStudy } from '@/db/study'
import StudyRights from '@/environments/base/study/StudyRights'
import StudyRightsClickson from '@/environments/clickson/study/StudyRightsClickson'
import StudyRightsCut from '@/environments/cut/study/StudyRightsCut'
import { EmissionFactorImportVersion, Environment, StudyRole } from '@prisma/client'
import { UserSession } from 'next-auth'
import DynamicComponent from '../utils/DynamicComponent'

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
      defaultComponent={
        <StudyRights
          user={user}
          study={study}
          editionDisabled={editionDisabled}
          userRoleOnStudy={userRoleOnStudy}
          emissionFactorSources={emissionFactorSources}
        />
      }
      environmentComponents={{
        [Environment.CUT]: <StudyRightsCut study={study} />,
        [Environment.CLICKSON]: (
          <StudyRightsClickson
            study={study}
            editionDisabled={editionDisabled}
            emissionFactorSources={emissionFactorSources}
            userRoleOnStudy={userRoleOnStudy}
          />
        ),
      }}
    />
  )
}

export default DynamicStudyRights
