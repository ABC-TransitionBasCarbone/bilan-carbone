import React, { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import EmissionFactors from '../emissionFactor/EmissionFactors'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

const EmissionFactorsPage = () => {
  const tNav = useTranslations('nav')
  const t = useTranslations('emissionFactors')
  return (
    <>
      <Breadcrumbs current={tNav('emissionFactors')} links={[{ label: tNav('home'), link: '/' }]} />
      <Block title={t('title')} as="h1">
        <Suspense fallback={t('loading')}>
          <EmissionFactors />
        </Suspense>
      </Block>
    </>
  )
}

export default EmissionFactorsPage
