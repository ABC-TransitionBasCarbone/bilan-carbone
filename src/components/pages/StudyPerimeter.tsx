'use server'

import { OrganizationWithSites } from '@/db/account'
import { getDocumentsForStudy } from '@/db/document'
import { FullStudy } from '@/db/study'
import { getUserApplicationSettings } from '@/db/user'
import { hasAccessToDependencyMatrix, hasAccessToPerimeterPage } from '@/services/permissions/environment'
import { canEditStudyFlows } from '@/services/permissions/study'
import { defaultCAUnit } from '@/utils/number'
import { getAccountRoleOnStudy } from '@/utils/study'
import { DocumentCategory } from '@prisma/client'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import DependencyMatrix from '../study/perimeter/documents/DependencyMatrix'
import StudyFlow from '../study/perimeter/documents/StudyFlow'
import StudyPerimeter from '../study/perimeter/StudyPerimeter'
import StudyTags from '../study/perimeter/StudyTags'

interface Props {
  study: FullStudy
  organizationVersion: OrganizationWithSites
  user: UserSession
}

const StudyPerimeterPage = async ({ study, organizationVersion, user }: Props) => {
  const tNav = await getTranslations('nav')
  const documents = await getDocumentsForStudy(study.id)

  const userRoleOnStudy = getAccountRoleOnStudy(user, study)

  if (!userRoleOnStudy) {
    return null
  }

  if (!hasAccessToPerimeterPage(user.environment)) {
    redirect(`/etudes/${study.id}`)
  }

  const caUnit = (await getUserApplicationSettings(user.accountId))?.caUnit || defaultCAUnit
  const canAddFlow = await canEditStudyFlows(study.id)

  const studyFlowDocuments = documents.filter((document) => !document.documentCategory)
  const dependencyMatrixDocuments = documents.filter(
    (document) => document.documentCategory === DocumentCategory.DependencyMatrix,
  )

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
      <StudyPerimeter
        study={study}
        organizationVersion={organizationVersion}
        userRoleOnStudy={userRoleOnStudy}
        caUnit={caUnit}
        user={user}
      />
      <StudyTags studyId={study.id} />
      <StudyFlow canAddFlow={canAddFlow} documents={studyFlowDocuments} study={study} />
      {hasAccessToDependencyMatrix(user.environment) && (
        <DependencyMatrix documents={dependencyMatrixDocuments} study={study} />
      )}
    </>
  )
}

export default StudyPerimeterPage
