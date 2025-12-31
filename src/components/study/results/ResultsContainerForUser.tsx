'use server'

import Block from '@/components/base/Block'
import { getOrganizationVersionStudiesOrderedByStartDate } from '@/db/study'
import { getUserApplicationSettings } from '@/db/user'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { canReadStudy } from '@/services/permissions/study'
import { Post } from '@/services/posts'
import { Environment } from '@prisma/client'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import StudyResultsContainerSummary from './StudyResultsContainerSummary'

interface Props {
  user: UserSession
  mainStudyOrganizationVersionId: string
}

const ResultsContainerForUser = async ({ user, mainStudyOrganizationVersionId }: Props) => {
  const environment = user.environment
  const t = await getTranslations('study')
  const [studies, settings] = await Promise.all([
    getOrganizationVersionStudiesOrderedByStartDate(mainStudyOrganizationVersionId),
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
      {environment === Environment.CUT && <h2 className="pb2">{t('lastStudyTitle')}</h2>}

      {mainStudy ? (
        <DynamicComponent
          environmentComponents={{
            [Environment.CLICKSON]: (
              <StudyResultsContainerSummary
                user={user}
                study={mainStudy}
                studySite="all"
                showTitle
                validatedOnly={settings.validatedEmissionSourcesOnly}
                customPostOrder={[
                  Post.EnergiesClickson,
                  Post.Restauration,
                  Post.DeplacementsClickson,
                  Post.Achats,
                  Post.ImmobilisationsClickson,
                ]}
              />
            ),
          }}
          defaultComponent={
            <StudyResultsContainerSummary
              user={user}
              study={mainStudy}
              studySite="all"
              showTitle
              validatedOnly={settings.validatedEmissionSourcesOnly}
            />
          }
        />
      ) : null}
    </Block>
  )
}

export default ResultsContainerForUser
