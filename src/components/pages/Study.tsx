'use server'

import { FullStudy } from '@/db/study'
import { canDeleteStudy } from '@/services/permissions/study'
import { getUserSettings } from '@/services/serverFunctions/user'
import { getTranslations } from 'next-intl/server'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyDetails from '../study/StudyDetails'

interface Props {
  study: FullStudy
}

const StudyPage = async ({ study }: Props) => {
  const tNav = await getTranslations('nav')
  const [canDelete, userSettings] = await Promise.all([canDeleteStudy(study.id), getUserSettings()])

  return (
    <>
      <Breadcrumbs
        current={study.name}
        links={[
          { label: tNav('home'), link: '/' },
          study.organization.isCR
            ? {
                label: study.organization.name,
                link: `/organisations/${study.organization.id}`,
              }
            : undefined,
        ].filter((link) => link !== undefined)}
      />
      <StudyDetails study={study} canDeleteStudy={canDelete} unit={userSettings?.studyUnit} />
    </>
  )
}

export default StudyPage
