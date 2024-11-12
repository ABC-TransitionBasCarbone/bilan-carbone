import { useTranslations } from 'next-intl'
import React from 'react'
import Block from '../base/Block'
import NewStudyRightForm from '../study/rights/NewStudyRightForm'
import { StudyWithRights } from '@/db/study'
import { User } from 'next-auth'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

interface Props {
  study: StudyWithRights
  user: User
}

const NewStudyRightPage = ({ study, user }: Props) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('study.rights.new')
  return (
    <>
      <Breadcrumbs
        current={tNav('newStudyRights')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
          { label: tNav('studyRights'), link: `/etudes/${study.id}/droits` },
        ]}
      />
      <Block title={t('title', { name: study.name })} as="h1">
        <NewStudyRightForm study={study} user={user} />
      </Block>
    </>
  )
}

export default NewStudyRightPage
