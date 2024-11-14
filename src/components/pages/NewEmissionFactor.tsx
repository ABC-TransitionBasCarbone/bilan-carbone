import { useTranslations } from 'next-intl'
import React from 'react'
import NewEmissionFactorForm from '../emissionFactor/new/Form'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

const NewEmissionFactorPage = () => {
  const tNav = useTranslations('nav')
  const t = useTranslations('emissionFactors.create')
  return (
    <>
      <Breadcrumbs
        current={t('title')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: tNav('emissionFactors'), link: '/facteurs-d-emission' },
        ]}
      />
      <Block title={t('title')} as="h1">
        <NewEmissionFactorForm />
      </Block>
    </>
  )
}

export default NewEmissionFactorPage
