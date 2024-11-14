import React from 'react'
import Block from '../base/Block'
import NewStudyRightForm from '../study/rights/NewStudyRightForm'
import { FullStudy } from '@/db/study'
import { User } from 'next-auth'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import { getTranslations } from 'next-intl/server'

interface Props {
  study: FullStudy
  user: User
}

  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.rights.new')
const NewStudyRightPage = async ({ study, user }: Props) => {
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
