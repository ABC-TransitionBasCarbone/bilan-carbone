'use client'

import { getFeaturesRestictions } from '@/db/deactivableFeatures'
import { useTranslations } from 'next-intl'
import DeactivableFeature from './DeactivableFeature'

interface Props {
  restrictions: AsyncReturnType<typeof getFeaturesRestictions>
}

const DeactivableFeatures = ({ restrictions }: Props) => {
  const t = useTranslations('deactivableFeatures')
  return (
    <>
      <h3 className="mt2 flex-col">{t('title')} :</h3>
      {restrictions.map((restrictions) => (
        <DeactivableFeature key={restrictions.feature} restrictions={restrictions} />
      ))}
    </>
  )
}

export default DeactivableFeatures
