import React from 'react'
import Block from '../base/Block'
import NewStudyContributorForm from '../study/rights/NewStudyContributorForm'
import { FullStudy } from '@/db/study'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import { getTranslations } from 'next-intl/server'

interface Props {
  study: FullStudy
}

const NewStudyContributorPage = async ({ study }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.rights.newContributor')

  return (
    <>
      <Breadcrumbs
        current={tNav('newStudyContributor')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
          { label: tNav('studyRights'), link: `/etudes/${study.id}/droits` },
        ]}
      />
      <Block title={t('title', { name: study.name })} as="h1">
        <NewStudyContributorForm study={study} />
      </Block>
    </>
  )
}

export default NewStudyContributorPage
