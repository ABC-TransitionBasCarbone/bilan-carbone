import { gazKeys } from '@/constants/emissions'
import { Post, subPostsByPost } from '@/services/posts'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { getQualityRating, qualityKeys } from '@/services/uncertainty'
import ShrinkIcon from '@mui/icons-material/ZoomInMap'
import ExpandIcon from '@mui/icons-material/ZoomOutMap'
import { Import, SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Fragment, useMemo, useState } from 'react'
import styles from './Detail.module.css'

interface Props {
  emissionFactor: EmissionFactorWithMetaData
}
const EmissionFactorDetails = ({ emissionFactor }: Props) => {
  const t = useTranslations('emissionFactors.table')
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('units')
  const tQuality = useTranslations('quality')
  const [displayDetailedQuality, setDisplayDetailedQuality] = useState(false)

  const gases = useMemo(() => gazKeys.filter((gaz) => emissionFactor[gaz]), [emissionFactor])
  const qualities = useMemo(() => qualityKeys.filter((quality) => emissionFactor[quality]), [emissionFactor])
  const quality = useMemo(() => getQualityRating(emissionFactor), [emissionFactor])

  const subPosts = emissionFactor.subPosts.reduce(
    (res, subPost) => {
      const post = Object.entries(subPostsByPost).find(([, value]) => value.includes(subPost))?.[0] as Post
      return { ...res, [post]: (res[post] || []).concat([subPost]) }
    },
    {} as Record<Post, SubPost[]>,
  )

  return (
    <>
      {emissionFactor.importedFrom !== Import.Manual && emissionFactor.version && (
        <div className={styles.info}>
          {t(emissionFactor.importedFrom)} {emissionFactor.version.name}
        </div>
      )}
      {emissionFactor.source && <div className={styles.info}>{emissionFactor.source}</div>}
      <div className={styles.info}>
        <div className={classNames(styles.list, 'grid')}>
          <span className="align-center">{t('qualityRating')}</span>
          <span className="align-center">
            {tQuality(quality?.toString())}
            <span
              className={classNames(styles.expandIcon, 'ml-4')}
              onClick={() => setDisplayDetailedQuality(!displayDetailedQuality)}
            >
              {displayDetailedQuality ? <ShrinkIcon /> : <ExpandIcon />}
            </span>
          </span>
          {displayDetailedQuality && (
            <>
              {qualities.map((quality) => (
                <Fragment key={quality}>
                  <span>{t(quality)}</span>
                  <span>{tQuality(emissionFactor[quality]?.toString())}</span>
                </Fragment>
              ))}
            </>
          )}
        </div>
      </div>
      {Object.entries(subPosts).length > 0 && (
        <div className={styles.info}>
          {Object.entries(subPosts).map(([post, subPosts]) => (
            <div key={post}>
              {t('post')} {tPost(post)} ({subPosts.map((subPost) => tPost(subPost)).join(', ')})
            </div>
          ))}
        </div>
      )}
      {emissionFactor.metaData?.location && <div className={styles.info}>{emissionFactor.metaData.location}</div>}
      {emissionFactor.metaData?.comment && <div className={styles.info}>{emissionFactor.metaData.comment}</div>}
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
