import React from 'react'
import { User } from 'next-auth'
import { FullStudy } from '@/db/study'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import StudyPerimeter from '../study/perimeter/StudyPerimeter'
import { OrganizationWithSites } from '@/db/user'

interface Props {
  study: FullStudy
  user: User
  organization: OrganizationWithSites
}

const StudyPerimeterPage = async ({ study, user, organization }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.perimeter')

  const userRoleOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)

  return (
    <>
      <Breadcrumbs
        current={tNav('studyPermimeter')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
        ]}
      />
      <Block title={t('title', { name: study.name })} as="h1">
        <StudyPerimeter study={study} userRoleOnStudy={userRoleOnStudy} organization={organization} />
      </Block>
    </>
  )
}

export default StudyPerimeterPage
