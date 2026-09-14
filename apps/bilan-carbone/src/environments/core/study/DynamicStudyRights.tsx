'use client'

import { OrganizationWithSites } from '@/db/account'
import type { FullStudy, MinimalStudyForRights, StudySiteWithNameList } from '@/db/study'
import StudyRights from '@/environments/base/study/StudyRights'
import StudyRightsClickson from '@/environments/clickson/study/StudyRightsClickson'
import StudyRightsCut from '@/environments/cut/study/StudyRightsCut'
import StudyRightsTiltSimplified from '@/environments/tilt/study/StudyRightsTiltSimplified'
import type { EmissionFactorImportVersion } from '@abc-transitionbascarbone/db-common'
import { Environment, SiteCAUnit, StudyRole } from '@abc-transitionbascarbone/db-common/enums'
import { UserSession } from 'next-auth'
import DynamicComponent from '../utils/DynamicComponent'

interface Props {
  user: UserSession
  study: MinimalStudyForRights
  fullStudy: FullStudy
  editionDisabled: boolean
  userRoleOnStudy: StudyRole
  emissionFactorSources: EmissionFactorImportVersion[]
  caUnit: SiteCAUnit
  organizationVersion: OrganizationWithSites | null
  studySites: StudySiteWithNameList
}

const DynamicStudyRights = ({
  user,
  study,
  fullStudy,
  editionDisabled,
  userRoleOnStudy,
  emissionFactorSources,
  caUnit,
  organizationVersion,
  studySites,
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
            studySites={studySites}
          />
        ) : (
          <StudyRights
            user={user}
            study={fullStudy}
            editionDisabled={editionDisabled}
            userRoleOnStudy={userRoleOnStudy}
            emissionFactorSources={emissionFactorSources}
          />
        )
      }
      environmentComponents={{
        [Environment.CUT]: <StudyRightsCut study={fullStudy} />,
        [Environment.CLICKSON]: (
          <StudyRightsClickson
            study={fullStudy}
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
