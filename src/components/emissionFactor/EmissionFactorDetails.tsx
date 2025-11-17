import { gazKeys } from '@/constants/emissions'
import { environmentSubPostsMapping, Post, subPostBCToSubPostTiltMapping } from '@/services/posts'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { getQualityRating, qualityKeys } from '@/services/uncertainty'
import { BCUnit, useUnitLabel } from '@/services/unit'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { formatNumber } from '@/utils/number'
import ShrinkIcon from '@mui/icons-material/ZoomInMap'
import ExpandIcon from '@mui/icons-material/ZoomOutMap'
import { Environment, Import, StudyResultUnit, SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Fragment, useMemo, useState } from 'react'
import styles from './Detail.module.css'

interface Props {
  emissionFactor: EmissionFactorWithMetaData
}
const EmissionFactorDetails = ({ emissionFactor }: Props) => {
  const { environment } = useAppEnvironmentStore()

  const t = useTranslations('emissionFactors.table')
  const tPost = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')
  const tResultUnits = useTranslations('study.results.units')
  const tEmissionFactorType = useTranslations('emissionFactors.type')
  const [displayDetailedQuality, setDisplayDetailedQuality] = useState(false)
  const getUnitLabel = useUnitLabel()

  const gases = useMemo(() => gazKeys.filter((gaz) => emissionFactor[gaz]), [emissionFactor])
  const qualities = useMemo(() => qualityKeys.filter((quality) => emissionFactor[quality]), [emissionFactor])
  const quality = useMemo(() => getQualityRating(emissionFactor), [emissionFactor])

  const subPosts = useMemo(() => {
    return emissionFactor.subPosts
      .flatMap((subPost) => {
        if (!environment) {
          return [subPost]
        }

        switch (environment) {
          case Environment.TILT:
            return subPostBCToSubPostTiltMapping[subPost] ?? []
          case Environment.BC:
          default:
            return [subPost]
        }
      })
      .reduce(
        (res, subPost) => {
          if (!environment) {
            return res
          }

          const post = Object.entries(environmentSubPostsMapping[environment]).find(([, value]) =>
            value.includes(subPost),
          )?.[0] as Post

          return { ...res, [post]: (res[post] || new Set()).add(subPost) }
        },
        {} as Record<Post, Set<SubPost>>,
      )
  }, [emissionFactor.subPosts, environment])

  return (
    <>
      <div className={styles.info}>
        <span className={classNames(styles.infoTitle, 'bold')}>{t('source')} : </span>
        {emissionFactor.importedFrom !== Import.Manual && emissionFactor.version && (
          <>
            {t(emissionFactor.importedFrom)} {emissionFactor.version.name}
          </>
        )}
        {emissionFactor.source && <> - {emissionFactor.source}</>}
      </div>
      <div className={styles.info}>
        <span className={classNames(styles.infoTitle, 'bold')}>{t('qualityRating')} : </span>
        {quality && (
          <>
            <span>
              {tQuality(quality?.toString())}
              <span
                className={classNames(styles.expandIcon, 'ml-4')}
                onClick={() => setDisplayDetailedQuality(!displayDetailedQuality)}
              >
                {displayDetailedQuality ? <ShrinkIcon /> : <ExpandIcon />}
              </span>
            </span>
            <div className={classNames(styles.list, 'italic grid')}>
              {displayDetailedQuality && (
                <>
                  {qualities.map((quality) =>
                    emissionFactor[quality] ? (
                      <Fragment key={quality}>
                        <span>{t(quality)}</span>
                        <span>{tQuality(emissionFactor[quality].toString())}</span>
                      </Fragment>
                    ) : (
                      <></>
                    ),
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
      {Object.entries(subPosts).length > 0 && (
        <div className={styles.info}>
          <span className={classNames(styles.infoTitle, 'bold')}>{t('post')} : </span>
          <ul className={styles.listWithBullets}>
            {Object.entries(subPosts).map(([post, subPosts]) => (
              <li key={post}>
                {tPost(post)} (
                {Array.from(subPosts)
                  .map((subPost) => tPost(subPost))
                  .join(', ')}
                )
              </li>
            ))}
          </ul>
        </div>
      )}
      {emissionFactor.metaData?.location && (
        <div className={styles.info}>
          <span className={classNames(styles.infoTitle, 'bold')}>{t('location')} : </span>
          {emissionFactor.metaData.location}
        </div>
      )}
      {emissionFactor.metaData?.comment && (
        <div className={styles.info}>
          <span className={classNames(styles.infoTitle, 'bold')}>{t('comment')}</span>
          {emissionFactor.metaData.comment}
        </div>
      )}
      {gases.length > 0 && (
        <div className={classNames(styles.info, 'flex')}>
          <span className={classNames(styles.infoTitle, 'bold')}>{t('GESDecomposition')}&nbsp;</span>
          <div className="flex grow">
            {gases
              .map(
                (gaz) =>
                  `${t(gaz)} ${emissionFactor[gaz]} ${tResultUnits(StudyResultUnit.K)}/${getUnitLabel(emissionFactor.unit || BCUnit.KG, emissionFactor[gaz])}`,
              )
              .join(', ')}
          </div>
        </div>
      )}
      {emissionFactor.emissionFactorParts?.length > 0 && (
        <div className={classNames(styles.info, 'flex')}>
          <span className={classNames(styles.infoTitle, 'bold')}>{t('factorParts')}&nbsp;</span>
          <div className="flex grow">
            {emissionFactor.emissionFactorParts
              .map(
                (part) =>
                  `${tEmissionFactorType(part.type)}: ${formatNumber(part.totalCo2, 2)}
                ${tResultUnits(StudyResultUnit.K)}/${getUnitLabel(emissionFactor.unit || BCUnit.KG, part.totalCo2)}`,
              )
              .join(', ')}
          </div>
        </div>
      )}
    </>
  )
}

export default EmissionFactorDetails
