'use client'

import { FullStudy, StudySiteWithName, StudyWithReadRights } from '@/db/study'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { Environment, StudyRole } from '@abc-transitionbascarbone/db-common'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyManagementActions from '../study/StudyManagementActions'
import AllPostsInfographyContainer from '../study/infography/AllPostsInfographyContainer'
import SelectStudySite from '../study/site/SelectStudySite'
import useStudySite from '../study/site/useStudySite'

interface Props {
  studyId: string
  userRole: StudyRole
  user: UserSession
  canDeleteStudy?: boolean
  canDuplicateStudy?: boolean
  duplicableEnvironments: Environment[]
  studyOrganizationVersion: StudyWithReadRights['organizationVersion']
  studySites: StudySiteWithName[]
  studyName: string
  fullStudy: FullStudy
}

const StudyDataEntryInfographyPage = ({
  studyId,
  userRole,
  canDeleteStudy,
  canDuplicateStudy,
  duplicableEnvironments,
  studyOrganizationVersion,
  studySites,
  studyName,
  fullStudy,
}: Props) => {
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('fullStudy.navigation')
  const { siteId, studySiteId, setSite } = useStudySite(studyId, studySites)

  return (
    <>
      <Breadcrumbs
        current={tStudyNav('dataEntry')}
        links={[
          { label: tNav('home'), link: '/' },
          studyOrganizationVersion
            ? {
                label: studyOrganizationVersion.organization.name,
                link: `/organisations/${studyOrganizationVersion.id}`,
              }
            : undefined,

          { label: studyName, link: `/etudes/${studyId}` },
        ].filter((link) => link !== undefined)}
      />
      <StudyManagementActions
        study={fullStudy}
        organizationVersionId={studyOrganizationVersion?.id}
        canDeleteStudy={canDeleteStudy}
        canDuplicateStudy={canDuplicateStudy}
        duplicableEnvironments={duplicableEnvironments}
        userRole={userRole}
        siteId={siteId}
      >
        {(studyActions) => (
          <Block
            title={tStudyNav('dataEntry')}
            as="h2"
            actions={[...(studyActions ?? [])]}
            rightComponent={
              <SelectStudySite sites={studySites} defaultValue={siteId} setSite={setSite} showAllOption={false} />
            }
          >
            <AllPostsInfographyContainer study={fullStudy} studySiteId={studySiteId} siteId={siteId} />
          </Block>
        )}
      </StudyManagementActions>
    </>
  )
}

export default StudyDataEntryInfographyPage
