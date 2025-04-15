'use server'

import { OrganizationWithSites } from '@/db/account'
import { getDocumentsForStudy } from '@/db/document'
import { FullStudy } from '@/db/study'
import { getUserApplicationSettings } from '@/db/user'
import { defaultCAUnit } from '@/utils/number'
import { canEditStudyFlows } from '@/services/permissions/study'
import { getAccountRoleOnStudy } from '@/utils/study'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyFlow from '../study/perimeter/flow/StudyFlow'
import StudyPerimeter from '../study/perimeter/StudyPerimeter'

interface Props {
  study: FullStudy
  organizationVersion: OrganizationWithSites
  user: UserSession
}

const StudyPerimeterPage = async ({ study, organizationVersion, user }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.perimeter')
  const documents = await getDocumentsForStudy(study.id)

  const userRoleOnStudy = getAccountRoleOnStudy(user, study)

  if (!userRoleOnStudy) {
    return null
  }

  const caUnit = (await getUserApplicationSettings(user.id))?.caUnit || defaultCAUnit
  const canAddFlow = await canEditStudyFlows(study.id)

  return (
    <>
      <Breadcrumbs
        current={tNav('studyPerimeter')}
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
      <Block title={t('title', { name: study.name })} as="h1">
        <StudyPerimeter study={study} organizationVersion={organizationVersion} userRoleOnStudy={userRoleOnStudy} caUnit={caUnit} />
      </Block>
      <StudyFlow
        canAddFlow={canAddFlow}
        documents={documents}
        initialDocument={documents.length > 0 ? documents[0] : undefined}
        study={study}
      />
    </>
  )
}

export default StudyPerimeterPage
