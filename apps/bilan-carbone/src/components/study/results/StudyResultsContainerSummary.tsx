'use client'

import GlossaryModal from '@/components/modals/GlossaryModal'
import type { FullStudy } from '@/db/study'
import { hasAccessToStudyResults } from '@/services/permissions/environment'
import { getDetailedEmissionResults } from '@/services/study'
import { BCEnvironment } from '@/types/environment'
import { HelpIcon } from '@abc-transitionbascarbone/components'
import Box from '@abc-transitionbascarbone/components/src/base/Box'
import { BarChart } from '@abc-transitionbascarbone/ui'
import { customRich } from '@abc-transitionbascarbone/utils/customRich'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import styles from './ResultsContainer.module.css'

interface Props {
  study: FullStudy
  studySite: string
  validatedOnly?: boolean
  withDependencies?: boolean
}

const StudyResultsContainerSummary = ({ study, studySite, validatedOnly, withDependencies }: Props) => {
  const t = useTranslations('study')
  const tPost = useTranslations('emissionFactors.post')
  const tResultUnits = useTranslations('study.results.units')
  const tResults = useTranslations('study.results')
  const tDocumentation = useTranslations('documentationUrl')
  const [glossary, setGlossary] = useState('')
  const [withDep, setWithDependencies] = useState(!!withDependencies)
  const environment = study.organizationVersion.environment as BCEnvironment

  const [
    formattedWithDepValue,
    formattedWithoutDepValue,
    formattedMonetaryRatio,
    computedResultsWithDep,
    computedResultsWithoutDep,
  ] = useMemo(() => {
    const { withDepValue, withoutDepValue, monetaryRatio, resultsBySiteWithDep, resultsBySiteWithoutDep } =
      getDetailedEmissionResults(study, tPost, studySite, !!validatedOnly, environment, tResults)
    return [
      formatNumber(withDepValue),
      formatNumber(withoutDepValue),
      formatNumber(monetaryRatio, 2),
      resultsBySiteWithDep,
      resultsBySiteWithoutDep,
    ]
  }, [environment, study, studySite, tPost, tResults, validatedOnly])

  return (
    <>
      <div className={styles.container}>
        {hasAccessToStudyResults(environment) && (
          <fieldset className={classNames(styles.selector, 'flex grow')} aria-label={t('results.withDependencies')}>
            <label>
              <input
                type="radio"
                name="dependencySelection"
                value={t('results.withDependencies')}
                checked={withDep}
                onChange={() => setWithDependencies(true)}
                className={styles.hidden}
              />
              <Box selected={withDep} color="secondary" className={classNames(styles.card, 'flex-col flex-cc pointer')}>
                <h3 className="text-center" data-testid="withDep-total-result">
                  {formattedWithDepValue} {tResultUnits(study.resultsUnit)}
                </h3>
                <span className="align-center text-center">
                  {t('results.withDependencies')}
                  <HelpOutlineOutlinedIcon
                    color="secondary"
                    className={`ml-4 ${styles.helpIcon}`}
                    onClick={() => setGlossary('withDependencies')}
                  />
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
              <Box
                selected={!withDep}
                color="secondary"
                className={classNames(styles.card, 'flex-col flex-cc pointer')}
              >
                <h3 className="text-center" data-testid="withoutDep-total-result">
                  {formattedWithoutDepValue} {tResultUnits(study.resultsUnit)}
                </h3>
                <span className="text-center">{t('results.withoutDependencies')}</span>
              </Box>
            </label>
            <Box className={classNames(styles.card, styles.disabled, 'flex-col flex-cc')}>
              <h3 className="text-center" data-testid="results-monetary-ratio">
                {formattedMonetaryRatio} %
              </h3>
              <span className="text-center align-center">
                {t('results.monetaryRatio')}
                <HelpIcon
                  color="secondary"
                  className={`ml-4 ${styles.helpIcon}`}
                  onClick={() => setGlossary('monetaryRatio')}
                  label={t('information')}
                />
              </span>
            </Box>
          </fieldset>
        )}
        <div className="grow">
          <BarChart
            results={withDep ? computedResultsWithDep : computedResultsWithoutDep}
            resultsUnit={study.resultsUnit}
            height={450}
            showTitle={false}
            showLegend={false}
            showLabelsOnBars={false}
          />
        </div>
      </div>
      <GlossaryModal
        glossary={glossary ? `results.${glossary}` : ''}
        onClose={() => setGlossary('')}
        label="withDependestudy-results-glossary"
        t={t}
      >
        <span>
          {glossary && (
            <>
              {customRich(t, `${glossary}Description`, {
                link: (children) => (
                  <Link href={tDocumentation('dependencyAndResponsability')} target="_blank" rel="noreferrer noopener">
                    {children}
                  </Link>
                ),
                monetaryLink: (children) => (
                  <Link href={tDocumentation('monetaryRatio')} target="_blank" rel="noreferrer noopener">
                    {children}
                  </Link>
                ),
              })}
            </>
          )}
        </span>
      </GlossaryModal>
    </>
  )
}

export default StudyResultsContainerSummary
