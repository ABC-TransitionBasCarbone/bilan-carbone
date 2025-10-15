'use client'

import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import HelpIcon from '@/components/base/HelpIcon'
import StyledChip from '@/components/base/StyledChip'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { FullStudy } from '@/db/study'
import { getDetailedEmissionResults } from '@/services/study'
import { formatNumber } from '@/utils/number'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import SpaIcon from '@mui/icons-material/Spa'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import BarChart from '../charts/BarChart'
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
  const tResults = useTranslations('study.results')
  const [glossary, setGlossary] = useState('')
  const [withDep, setWithDependencies] = useState(!!withDependencies)
  const environment = study.organizationVersion.environment

  const isCut = useMemo(() => environment === Environment.CUT, [environment])

  const [
    formattedWithDepValue,
    formattedWithoutDepValue,
    formattedMonetaryRatio,
    computedResultsWithDep,
    computedResultsWithoutDep,
  ] = useMemo(() => {
    const { withDepValue, withoutDepValue, monetaryRatio, computedResultsWithDep, computedResultsWithoutDep } =
      getDetailedEmissionResults(study, tPost, studySite, !!validatedOnly, environment, tResults)
    return [
      formatNumber(withDepValue),
      formatNumber(withoutDepValue),
      formatNumber(monetaryRatio, 2),
      computedResultsWithDep,
      computedResultsWithoutDep,
    ]
  }, [environment, study, studySite, tPost, tResults, validatedOnly])

  return (
    <>
      {withDependencies === undefined && showTitle && (
        <div className={`${styles.header} flex justify-between mb1`}>
          <div className={styles.studyNameContainer}>
            <StyledChip
              icon={<SpaIcon />}
              color="success"
              label={study.name}
              component="a"
              href={`/etudes/${study.id}`}
              clickable
            />
          </div>
          <Button className={styles.seeResultsButton} href={`/etudes/${study.id}/comptabilisation/resultats`}>
            {t('seeResults')}
          </Button>
        </div>
      )}

      <div className={styles.container}>
        {!isCut && (
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
              {t.rich(`${glossary}Description`, {
                link: (children) => (
                  <Link
                    href="https://www.bilancarbone-methode.com/annexes/annexes/annexe-1-grands-principes-de-comptabilisation-du-bilan-carbone-r#zoom-sur-les-sous-postes-utilisation-en-responsabilite-et-utilisation-en-dependance"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {children}
                  </Link>
                ),
                monetaryLink: (children) => (
                  <Link
                    href="https://www.bilancarbone-methode.com/4-comptabilisation/4.3-methode-de-selection-des-facteurs-demission#fe-en-ratios-monetaires"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
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
