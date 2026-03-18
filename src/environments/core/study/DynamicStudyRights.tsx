'use client'

import { OrganizationWithSites } from '@/db/account'
import { FullStudy } from '@/db/study'
import StudyRights from '@/environments/base/study/StudyRights'
import StudyRightsClickson from '@/environments/clickson/study/StudyRightsClickson'
import StudyRightsCut from '@/environments/cut/study/StudyRightsCut'
import StudyRightsTiltSimplified from '@/environments/tilt/study/StudyRightsTiltSimplified'
import { EmissionFactorImportVersion, Environment, SiteCAUnit, StudyRole } from '@prisma/client'
import { UserSession } from 'next-auth'
import DynamicComponent from '../utils/DynamicComponent'

interface Props {
  user: UserSession
  study: FullStudy
  editionDisabled: boolean
  userRoleOnStudy: StudyRole
  emissionFactorSources: EmissionFactorImportVersion[]
  caUnit: SiteCAUnit
  organizationVersion: OrganizationWithSites | null
}

const DynamicStudyRights = ({
  user,
  study,
  editionDisabled,
  userRoleOnStudy,
  emissionFactorSources,
  caUnit,
  organizationVersion,
}: Props) => {
  return (
    <DynamicComponent
      defaultComponent={
        study.simplified ? (
          <StudyRightsTiltSimplified
            study={study}
            caUnit={caUnit}
            user={user}
            organizationVersion={organizationVersion}
            userRoleOnStudy={userRoleOnStudy}
          />
        ) : (
          <StudyRights
            user={user}
            study={study}
            editionDisabled={editionDisabled}
            userRoleOnStudy={userRoleOnStudy}
            emissionFactorSources={emissionFactorSources}
          />
        )
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
