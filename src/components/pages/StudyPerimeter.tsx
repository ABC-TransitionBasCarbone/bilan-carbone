'use client'

import { FullStudy } from '@/db/study'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyFlow from '../study/perimeter/StudyFlow'
import StudyPerimeter from '../study/perimeter/StudyPerimeter'

interface Props {
  study: FullStudy
  user: User
}

const StudyPerimeterPage = ({ study, user }: Props) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('study.perimeter')

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
        <StudyPerimeter study={study} userRoleOnStudy={userRoleOnStudy} />
      </Block>
      <StudyFlow study={study} />
    </>
  )
}

export default StudyPerimeterPage
