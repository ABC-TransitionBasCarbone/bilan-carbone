'use client'

import EmissionSourceButtons from '@/components/study/buttons/EmissionSourceButtons'
import type { FullStudy } from '@/db/study'
import { hasAccessToDownloadStudyEmissionSourcesButton } from '@/services/permissions/environment'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { Environment, StudyRole } from '@abc-transitionbascarbone/db-common/enums'
import { useToast } from '@abc-transitionbascarbone/ui'
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

const StudyContributionPage = ({
  study,
  userRole,
  canDeleteStudy,
  canDuplicateStudy,
  duplicableEnvironments,
  organizationVersionId,
}: Props) => {
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const tImport = useTranslations('study.importEmissionSourcesModal')
  const { siteId, studySiteId, setSite } = useStudySite(study)
  const { showSuccessToast } = useToast()
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
      >
        {(studyActions) => (
          <Block
            title={tStudyNav('dataEntry')}
            as="h2"
            actions={[
              ...(hasAccessToDownloadStudyEmissionSourcesButton(study.organizationVersion.environment) && !study.simplified
                ? [
                    {
                      actionType: 'node' as const,
                      node: (
                        <EmissionSourceButtons
                          studyId={study.id}
                          userRole={userRole}
                          siteId={siteId}
                          hasEmissionSources={study.emissionSources.length > 0}
                          onSuccess={() => {
                            showSuccessToast(tImport('success'))
                            router.refresh()
                          }}
                        />
                      ),
                    },
                  ]
                : []),
              ...studyActions,
            ]}
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

export default StudyContributionPage
