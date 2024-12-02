import { gazKeys } from '@/constants/emissions'
import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import { subPostsByPost } from '@/services/posts'
import { getQualityRating, qualityKeys } from '@/services/uncertainty'
import { Import } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './Detail.module.css'

interface Props {
  emissionFactor: EmissionFactorWithMetaData
}
const EmissionFactorDetails = ({ emissionFactor }: Props) => {
  const t = useTranslations('emissionFactors.table')
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('units')
  const tQuality = useTranslations('quality')

  const gases = useMemo(() => gazKeys.filter((gaz) => emissionFactor[gaz]), [emissionFactor])
  const qualities = useMemo(() => qualityKeys.filter((quality) => emissionFactor[quality]), [emissionFactor])
  const quality = useMemo(() => getQualityRating(emissionFactor), [emissionFactor])

  return (
    <>
      {emissionFactor.importedFrom === Import.BaseEmpreinte && emissionFactor.version && (
        <div className={styles.info}>
          {t('BaseEmpreinte')} {emissionFactor.version.name} - {t(emissionFactor.status)}
        </div>
      )}
      <div className={styles.info}>
        <div>
          {t('qualityRating')} {tQuality(quality?.toString())}
        </div>
        <div className={classNames(styles.list, 'flex')}>
          {qualities.map((quality) => (
            <div key={quality}>
              {t(quality)} {tQuality(emissionFactor[quality]?.toString())}
            </div>
          ))}
        </div>
      </div>
      {emissionFactor.subPosts.length > 0 && (
        <div className={styles.info}>
          {emissionFactor.subPosts.map((subPost) => (
            <div key={subPost}>
              {t('post')} {tPost(Object.entries(subPostsByPost).find(([, value]) => value.includes(subPost))?.[0])} -{' '}
              {t('subPost')} {tPost(subPost)}
            </div>
          ))}
        </div>
      )}
      {emissionFactor.metaData?.location && <div className={styles.info}>{emissionFactor.metaData.location}</div>}
      {emissionFactor.metaData?.comment && <div className={styles.info}>{emissionFactor.metaData.comment}</div>}
      {emissionFactor.source && <div className={styles.info}>{emissionFactor.source}</div>}
      {gases.length > 0 && (
        <div className={classNames(styles.info, styles.list, 'flex')}>
          {gases.map((gaz) => (
            <div key={gaz}>
              {t(gaz)} {emissionFactor[gaz]} kgCO₂e/{tUnits(emissionFactor.unit)}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default EmissionFactorDetails
