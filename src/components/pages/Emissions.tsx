import React, { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import Emissions from '../emission/Emissions'

const EmissionsPage = () => {
  const t = useTranslations('emissions')
  return (
    <>
      <h1>{t('title')}</h1>
      <div className="my2">
        <Suspense fallback={t('loading')}>
          <Emissions />
        </Suspense>
      </div>
    </>
  )
}

export default EmissionsPage
