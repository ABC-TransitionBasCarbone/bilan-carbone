'use server'

import Block from '@/components/base/Block'
import { getOrganizationVersionStudiesOrderedByStartDate } from '@/db/study'
import { getUserApplicationSettings } from '@/db/user'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { canReadStudy } from '@/services/permissions/study'
import { Environment } from '@repo/db-common/enums'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import dynamic from 'next/dynamic'
import StudyResultsContainerSummary from './StudyResultsContainerSummary'

const StudyResultsContainerSummaryPublicodes = dynamic(
  () => import('@/environments/simplified/study/results/StudyResultsContainerSummaryPublicodes'),
)

interface Props {
  user: UserSession
  mainStudyOrganizationVersionId: string
  displaySimplifiedStudies: boolean
}

const ResultsContainerForUser = async ({ user, mainStudyOrganizationVersionId, displaySimplifiedStudies }: Props) => {
  const t = await getTranslations('study')
  const [studies, settings] = await Promise.all([
    getOrganizationVersionStudiesOrderedByStartDate(mainStudyOrganizationVersionId, displaySimplifiedStudies),
    getUserApplicationSettings(user.accountId),
  ])

  let mainStudy = null
  for (const study of studies) {
    const result = await canReadStudy(user, study.id)
    if (result) {
      mainStudy = study
      break
    }
  }

  return (
    <Block>
      <DynamicComponent
        environmentComponents={{
          [Environment.CUT]: (
            <>
              <h2 className="pb2">{t('lastStudyTitle')}</h2>
              {mainStudy ? <StudyResultsContainerSummaryPublicodes study={mainStudy} /> : null}
            </>
          ),
          [Environment.CLICKSON]: (
            <>
              <h2 className="pb2">{t('lastStudyTitle')}</h2>
              {mainStudy ? <StudyResultsContainerSummaryPublicodes study={mainStudy} /> : null}
            </>
          ),
        }}
        defaultComponent={
          mainStudy ? (
            <StudyResultsContainerSummary
              user={user}
              study={mainStudy}
              studySite="all"
              showTitle
              validatedOnly={settings.validatedEmissionSourcesOnly}
            />
          ) : null
        }
      />
    </Block>
  )
}

export default ResultsContainerForUser
