'use client'

import type { FullStudy } from '@/db/study'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { Environment, StudyRole } from '@abc-transitionbascarbone/db-common/enums'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyManagementActions from '../study/StudyManagementActions'
import AllPostsInfographyContainer from '../study/infography/AllPostsInfographyContainer'
import SelectStudySite from '../study/site/SelectStudySite'
import useStudySite from '../study/site/useStudySite'

interface Props {
  study: FullStudy
  userRole: StudyRole
  user: UserSession
  canDeleteStudy?: boolean
  canDuplicateStudy?: boolean
  duplicableEnvironments: Environment[]
  organizationVersionId: string | null
}

const StudyDataEntryInfographyPage = ({
  study,
  userRole,
  canDeleteStudy,
  canDuplicateStudy,
  duplicableEnvironments,
  organizationVersionId,
}: Props) => {
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const { siteId, studySiteId, setSite } = useStudySite(study)
  const router = useRouter()

  return (
    <>
      <Breadcrumbs
        current={tStudyNav('dataEntry')}
        links={[
          { label: tNav('home'), link: '/' },
          study.organizationVersion.isCR
            ? {
                label: study.organizationVersion.organization.name,
                link: `/organisations/${study.organizationVersion.id}`,
              }
            : undefined,

          { label: study.name, link: `/etudes/${study.id}` },
        ].filter((link) => link !== undefined)}
      />
      <StudyManagementActions
        study={study}
        organizationVersionId={organizationVersionId}
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
              <SelectStudySite sites={study.sites} defaultValue={siteId} setSite={setSite} showAllOption={false} />
            }
          >
            <AllPostsInfographyContainer study={study} studySiteId={studySiteId} siteId={siteId} />
          </Block>
        )}
      </StudyManagementActions>
    </>
  )
}

export default StudyDataEntryInfographyPage
