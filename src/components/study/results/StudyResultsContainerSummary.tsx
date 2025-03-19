'use client'

import Box from '@/components/base/Box'
import HelpIcon from '@/components/base/HelpIcon'
import LinkButton from '@/components/base/LinkButton'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { filterWithDependencies } from '@/services/results/utils'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import StudyName from '../card/StudyName'
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
  const tResultUnits = useTranslations('study.results.units')
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const [withDep, setWithDependencies] = useState(!!withDependencies)

  const allComputedResults = useMemo(
    () => computeResultsByPost(study, tPost, studySite, true, validatedOnly),
    [studySite, validatedOnly],
  )

  const computedResults = useMemo(
    () =>
      allComputedResults
        .map((post) => ({
          ...post,
          subPosts: post.subPosts.filter((subPost) => filterWithDependencies(subPost.post as SubPost, withDep)),
        }))
        .map((post) => ({ ...post, value: post.subPosts.reduce((res, subPost) => res + subPost.value, 0) })),
    [allComputedResults, withDep],
  )

  const [withDepValue, withoutDepValue] = useMemo(() => {
    const computedResults = computeResultsByPost(study, tPost, studySite, true, validatedOnly)
    const total = computedResults.find((result) => result.post === 'total')?.value || 0

    const dependenciesSubPost = SubPost.UtilisationEnDependance

    const dependenciesPost = Object.keys(subPostsByPost).find((key) =>
      subPostsByPost[key as Post].includes(dependenciesSubPost),
    )

    const dependenciesValue =
      computedResults
        .find((result) => result.post === dependenciesPost)
        ?.subPosts.find((subPost) => subPost.post === dependenciesSubPost)?.value || 0

    return [total, total - dependenciesValue].map((value) => formatNumber(value / STUDY_UNIT_VALUES[study.resultsUnit]))
  }, [study, studySite, validatedOnly])

  return (
    <>
      {withDependencies === undefined && showTitle && (
        <div className="justify-between mb1">
          <Link className={styles.studyNameLink} href={`/etudes/${study.id}`}>
            <StudyName name={study.name} />
          </Link>
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
              <h3 className="text-center">
                {withDepValue} {tResultUnits(study.resultsUnit)}
              </h3>
              <span className="align-center text-center">
                {t('results.withDependencies')}
                <HelpIcon className="ml-4" onClick={() => setGlossaryOpen(!glossaryOpen)} label={t('information')} />
              </span>
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
              <h3 className="text-center">
                {withoutDepValue} {tResultUnits(study.resultsUnit)}
              </h3>
              <span className="text-center">{t('results.withoutDependencies')}</span>
            </Box>
          </label>
        </fieldset>
        <div className={styles.graph}>
          <Result studySite={studySite} computedResults={computedResults} resultsUnit={study.resultsUnit} />
        </div>
      </div>
      <GlossaryModal
        glossary={glossaryOpen ? 'results.withDependencies' : ''}
        onClose={() => setGlossaryOpen(false)}
        label="withDependencies"
        t={t}
      >
        <span>
          {t.rich('withDependencies', {
            link: (children) => (
              <Link
                href="https://www.bilancarbone-methode.com/annexes/annexes/annexe-1-grands-principes-de-comptabilisation-du-bilan-carbone-r#zoom-sur-les-sous-postes-utilisation-en-responsabilite-et-utilisation-en-dependance"
                target="_blank"
                rel="noreferrer noopener"
              >
                {children}
              </Link>
            ),
          })}
        </span>
      </GlossaryModal>
    </>
  )
}

export default StudyResultsContainerSummary
