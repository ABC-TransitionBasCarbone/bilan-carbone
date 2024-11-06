import React, { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import Emissions from '../emission/Emissions'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

const EmissionsPage = () => {
  const tNav = useTranslations('nav')
  const t = useTranslations('emissions')
  return (
    <>
      <Breadcrumbs current={tNav('emissions')} links={[{ label: tNav('home'), link: '/' }]} />
      <Block title={t('title')} as="h1">
        <Suspense fallback={t('loading')}>
          <Emissions />
        </Suspense>
      </Block>
    </>
  )
}

export default EmissionsPage
