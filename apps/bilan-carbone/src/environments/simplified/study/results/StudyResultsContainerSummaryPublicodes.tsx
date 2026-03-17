'use client'

import StudyName from '@/components/study/card/StudyName'
import BarChart from '@/components/study/charts/BarChart'
import styles from '@/components/study/results/ResultsContainer.module.css'
import { FullStudy } from '@/db/study'
import { usePublicodesResults } from '@/hooks/usePublicodesResults'
import CircularProgress from '@mui/material/CircularProgress'
import { Button } from '@repo/ui'
import { useTranslations } from 'next-intl'

interface Props {
  study: FullStudy
}

const StudyResultsContainerSummaryPublicodes = ({ study }: Props) => {
  const t = useTranslations('study')
  const { aggregated, isLoading, error } = usePublicodesResults(study, 'all', study.organizationVersion.environment)

  return (
    <>
      <div className={`${styles.header} flex justify-between mb1`}>
        <div className={styles.studyNameContainer}>
          <StudyName studyId={study.id} name={study.name} role={null} />
        </div>
        <Button className={styles.seeResultsButton} href={`/etudes/${study.id}/comptabilisation/resultats`}>
          {t('seeResults')}
        </Button>
      </div>
      <div className={styles.container}>
        {isLoading || error ? (
          <div className="grow flex justify-center align-center" style={{ minHeight: 200 }}>
            {isLoading ? <CircularProgress /> : <p>{error}</p>}
          </div>
        ) : null}
        {!isLoading && !error ? (
          <div className="grow">
            <BarChart
              results={aggregated}
              resultsUnit={study.resultsUnit}
              height={450}
              showTitle={false}
              showLegend={false}
              showLabelsOnBars={false}
            />
          </div>
        ) : null}
      </div>
    </>
  )
}

export default StudyResultsContainerSummaryPublicodes
