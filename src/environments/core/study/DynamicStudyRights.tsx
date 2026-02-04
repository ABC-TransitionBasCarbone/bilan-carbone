'use client'

import { FullStudy } from '@/db/study'
import { EmissionFactorImportVersion, Environment, StudyRole } from '@prisma/client'
import { UserSession } from 'next-auth'
import dynamic from 'next/dynamic'
import DynamicComponent from '../utils/DynamicComponent'

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
            user={user}
          />
        ),
      }}
    />
  )
}

export default DynamicStudyRights
