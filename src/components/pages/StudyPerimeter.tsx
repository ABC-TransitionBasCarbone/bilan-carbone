'use server'

import { getDocumentsForStudy } from '@/db/document'
import { FullStudy } from '@/db/study'
import { canAddFlowToStudy } from '@/services/permissions/study'
import { User } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyFlow from '../study/perimeter/flow/StudyFlow'
import StudyPerimeter from '../study/perimeter/StudyPerimeter'

interface Props {
  study: FullStudy
  user: User
}

const StudyPerimeterPage = async ({ study, user }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.perimeter')
  const documents = await getDocumentsForStudy(study.id)

  const userRoleOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)

  const canAddFlow = await canAddFlowToStudy(study.id)

  return (
    <>
      <Breadcrumbs
        current={tNav('studyPerimeter')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
        ]}
      />
      <Block title={t('title', { name: study.name })} as="h1">
        <StudyPerimeter study={study} userRoleOnStudy={userRoleOnStudy} />
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
