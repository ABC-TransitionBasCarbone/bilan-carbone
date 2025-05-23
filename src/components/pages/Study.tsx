'use server'

import { FullStudy } from '@/db/study'
import { getUserApplicationSettings } from '@/db/user'
import { canDeleteStudy } from '@/services/permissions/study'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyDetails from '../study/StudyDetails'

interface Props {
  study: FullStudy
  user: UserSession
}

const StudyPage = async ({ study, user }: Props) => {
  const tNav = await getTranslations('nav')
  const [canDelete, settings] = await Promise.all([
    canDeleteStudy(study.id),
    getUserApplicationSettings(user.accountId),
  ])

  return (
    <>
      <Breadcrumbs
        current={study.name}
        links={[
          { label: tNav('home'), link: '/' },
          study.organizationVersion.isCR
            ? {
                label: study.organizationVersion.organization.name,
                link: `/organisations/${study.organizationVersion.id}`,
              }
            : undefined,
        ].filter((link) => link !== undefined)}
      />
      <StudyDetails study={study} canDeleteStudy={canDelete} validatedOnly={settings.validatedEmissionSourcesOnly} />
    </>
  )
}

export default StudyPage
