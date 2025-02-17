'use client'

import Box from '@/components/base/Box'
import LinkButton from '@/components/base/LinkButton'
import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { filterWithDependencies } from '@/services/results/utils'
import { formatNumber } from '@/utils/number'
import Leaf from '@mui/icons-material/Spa'
import { SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import Result from './Result'
import styles from './ResultsContainer.module.css'

interface Props {
  study: FullStudy
  studySite: string
  showTitle?: boolean
  validatedOnly?: boolean
  withDependencies?: boolean
}

const StudyResultsContainerSummary = ({ study, studySite, showTitle, validatedOnly, withDependencies }: Props) => {
  const t = useTranslations('study')
  const tPost = useTranslations('emissionFactors.post')
  const tResults = useTranslations('results')
  const [withDep, setWithDependencies] = useState(!!withDependencies)

  const [withDepValue, withoutDepValue] = useMemo(() => {
    const computedResults = computeResultsByPost(study, tPost, studySite, true, validatedOnly)
    return computedResults
      .reduce(
        (res, post) => {
          if (post.post !== Post.UtilisationEtDependance) {
            return res.map((value) => value + post.value)
          }
          const filteredValue = post.subPosts
            .filter((subPost) => filterWithDependencies(subPost.post as SubPost, false))
            .reduce((value, subPost) => value + subPost.value, 0)
          return [res[0] + post.value, res[1] + filteredValue]
        },
        [0, 0],
      )
      .map((value) => formatNumber(value * 1000))
  }, [validatedOnly])

  return (
    <>
      {withDependencies === undefined && showTitle && (
        <div className="justify-between mb1">
          <div className={classNames(styles.studyName, 'align-center')}>
            <Link className={classNames(styles.studyName, 'align-center')} href={`/etudes/${study.id}`}>
              <Leaf />
              {study.name}
            </Link>
          </div>
          <LinkButton href={`/etudes/${study.id}/comptabilisation/resultats`}>{t('seeResults')}</LinkButton>
        </div>
      )}
      <div className={styles.container}>
        <fieldset
          className={classNames(styles.selector, 'grow justify-around')}
          aria-label={t('results.withDependencies')}
        >
          <label>
            <input
              type="radio"
              name="dependencySelection"
              value={t('results.withDependencies')}
              checked={withDep}
              onChange={() => setWithDependencies(true)}
              className={styles.hidden}
            />
            <Box className={classNames(styles.card, 'flex-col flex-cc m2 px3', { [styles.selected]: withDep })}>
              <h3>
                {withDepValue} {tResults('unit')}
              </h3>
              <span>{t('results.withDependencies')}</span>
            </Box>
          </label>
          <label>
            <input
              type="radio"
              name="dependencySelection"
              value={t('results.withoutDependencies')}
              checked={!withDep}
              onChange={() => setWithDependencies(false)}
              className={styles.hidden}
            />
            <Box className={classNames(styles.card, 'flex-col flex-cc m2 px3', { [styles.selected]: !withDep })}>
              <h3>
                {withoutDepValue} {tResults('unit')}
              </h3>
              <span>{t('results.withoutDependencies')}</span>
            </Box>
          </label>
        </fieldset>
        <div className={styles.graph}>
          <Result study={study} studySite={studySite} withDependenciesGlobal={withDep} />
        </div>
      </div>
    </>
  )
}

export default StudyResultsContainerSummary
