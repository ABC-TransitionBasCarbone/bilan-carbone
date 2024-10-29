import React, { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import Emissions from '../emission/Emissions'
import Block from '../base/Block'

const EmissionsPage = () => {
  const t = useTranslations('emissions')
  return (
    <Block title={t('title')} as="h1">
      <Suspense fallback={t('loading')}>
        <Emissions />
      </Suspense>
    </Block>
  )
}

export default EmissionsPage
