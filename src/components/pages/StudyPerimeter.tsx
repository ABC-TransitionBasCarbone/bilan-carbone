'use server'

import { getDocumentsForStudy } from '@/db/document'
import { FullStudy } from '@/db/study'
import { getUserApplicationSettings, OrganizationWithSites } from '@/db/user'
import { canEditStudyFlows } from '@/services/permissions/study'
import { getUserRoleOnStudy } from '@/utils/study'
import { SiteCAUnit } from '@prisma/client'
import { User } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyFlow from '../study/perimeter/flow/StudyFlow'
import StudyPerimeter from '../study/perimeter/StudyPerimeter'

interface Props {
  study: FullStudy
  organization: OrganizationWithSites
  user: User
}

const StudyPerimeterPage = async ({ study, organization, user }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.perimeter')
  const documents = await getDocumentsForStudy(study.id)

  const userRoleOnStudy = getUserRoleOnStudy(user, study)

  if (!userRoleOnStudy) {
    return null
  }

  const caUnit = (await getUserApplicationSettings(user.id))?.caUnit || SiteCAUnit.K
  const canAddFlow = await canEditStudyFlows(study.id)

  return (
    <>
      <Breadcrumbs
        current={tNav('studyPerimeter')}
        links={[
          { label: tNav('home'), link: '/' },
          study.organization.isCR
            ? {
                label: study.organization.name,
                link: `/organisations/${study.organization.id}`,
              }
            : undefined,
          { label: study.name, link: `/etudes/${study.id}` },
        ].filter((link) => link !== undefined)}
      />
      <Block title={t('title', { name: study.name })} as="h1">
        <StudyPerimeter study={study} organization={organization} userRoleOnStudy={userRoleOnStudy} caUnit={caUnit} />
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
