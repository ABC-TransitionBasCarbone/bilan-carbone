import { useTranslations } from 'next-intl'
import React from 'react'
import NewEmissionForm from '../emission/new/Form'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

const NewEmissionPage = () => {
  const tNav = useTranslations('nav')
  const t = useTranslations('emissions.create')
  return (
    <>
      <Breadcrumbs
        current={t('title')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: tNav('emissions'), link: '/facteurs-d-emission' },
        ]}
      />
      <Block title={t('title')} as="h1">
        <NewEmissionForm />
      </Block>
    </>
  )
}

export default NewEmissionPage
