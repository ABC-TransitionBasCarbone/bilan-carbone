'use client'

import { FullStudy } from '@/db/study'
import StudyRights from '@/environments/base/study/StudyRights'
import StudyRightsCut from '@/environments/cut/study/StudyRights'
import { CUT } from '@/store/AppEnvironment'
import { EmissionFactorImportVersion, StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import DynamicComponent from '../utils/DynamicComponent'

interface Props {
  user: User
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
        [CUT]: (
          <StudyRightsCut
            user={user}
            study={study}
            editionDisabled={editionDisabled}
            userRoleOnStudy={userRoleOnStudy}
          />
        ),
      }}
    />
  )
}

export default DynamicStudyRights
