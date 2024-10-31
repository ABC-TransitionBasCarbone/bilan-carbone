import { useTranslations } from 'next-intl'
import React from 'react'

const NoActualities = () => {
  const t = useTranslations('actuality')
  return <p>{t('no-item')}</p>
}

export default NoActualities
