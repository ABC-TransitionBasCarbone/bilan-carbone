'use client'

import { getFeaturesRestictions } from '@/db/deactivableFeatures'
import { useTranslations } from 'next-intl'
import DeactivatedFeatureRestrictions from './DeactivatedFeatureRestrictions'

interface Props {
  restrictions: AsyncReturnType<typeof getFeaturesRestictions>
}

const DeactivatedFeaturesRestrictions = ({ restrictions }: Props) => {
  const t = useTranslations('deactivatedFeaturesRestrictions')
  return (
    <>
      <h3 className="mt2 flex-col">{t('title')} :</h3>
      {restrictions.map((restrictions) => (
        <DeactivatedFeatureRestrictions key={restrictions.feature} restrictions={restrictions} />
      ))}
    </>
  )
}

export default DeactivatedFeaturesRestrictions
