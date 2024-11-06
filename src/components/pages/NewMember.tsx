import { useTranslations } from 'next-intl'
import React from 'react'
import NewMemberForm from '../team/NewMemberForm'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

const NewMemberPage = () => {
  const tNav = useTranslations('nav')
  const t = useTranslations('new-member')
  return (
    <>
      <Breadcrumbs
        current={t('title')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: tNav('team'), link: '/equipe' },
        ]}
      />
      <Block title={t('title')} as="h1">
        <NewMemberForm />
      </Block>
    </>
  )
}

export default NewMemberPage
