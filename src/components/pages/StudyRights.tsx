import React from 'react'
import { User } from 'next-auth'
import { FullStudy } from '@/db/study'
import StudyRightsTable from '../study/rights/StudyRightsTable'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import { useTranslations } from 'next-intl'

interface Props {
  study: FullStudy
  user: User
}

const StudyRightsPage = ({ study, user }: Props) => {
  const tNav = useTranslations('nav')
  return (
    <>
      <Breadcrumbs
        current={tNav('studyRights')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
        ]}
      />
      <StudyRightsTable study={study} user={user} />
    </>
  )
}

export default StudyRightsPage
