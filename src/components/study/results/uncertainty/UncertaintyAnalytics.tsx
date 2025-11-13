import Title from '@/components/base/Title'
import { FullStudy } from '@/db/study'
import { ResultsByPost } from '@/services/results/consolidated'
import { getConfidenceInterval } from '@/services/uncertainty'
import { Environment, StudyResultUnit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import ConfidenceIntervalCharts from './ConfidenceIntervalChart'
import EmissionSourcePerPost from './EmissionSourcePerPost'
import UncertaintyGauge from './Gauge'
import MostUncertainPostsChart from './MostUncertainPostsChart'
import styles from './UncertaintyAnalytics.module.css'
import UncertaintyPerEmissionSource from './UncertaintyPerEmissionSource'
import UncertaintyPerPost from './UncertaintyPerPost'

interface Props {
  studyId: string
  resultsUnit: StudyResultUnit
  computedResults: ResultsByPost[]
  emissionSources: FullStudy['emissionSources']
  environment: Environment
  validatedOnly: boolean
}

const UncertaintyAnalytics = ({
  studyId,
  resultsUnit,
  computedResults,
  emissionSources,
  environment,
  validatedOnly,
}: Props) => {
  const t = useTranslations('study.results.uncertainties')

  const totalResults = computedResults.find((res) => res.post === 'total')
  const confidenceInterval = getConfidenceInterval(totalResults?.value ?? 0, totalResults?.uncertainty ?? 1)
  const percent = useMemo(() => {
    const [min, max] = confidenceInterval

    if (min === 0 && max === 0) {
      return 0
    }
    const realPercent = ((max - min) / max) * 100

    return realPercent
  }, [confidenceInterval])

  return (
    <div className="my2">
      <Title title={t('title')} as="h3" />
      <div className={styles.container}>
        <div className="grow flex-cc">
          <ConfidenceIntervalCharts confidenceInterval={confidenceInterval} unit={resultsUnit} percent={percent} />
        </div>
        <div className={classNames(styles.container2, 'grow2 flex-cc')}>
          <UncertaintyGauge uncertainty={computedResults.find((res) => res.post === 'total')?.uncertainty} />
          <MostUncertainPostsChart computedResults={computedResults} />
        </div>
      </div>
      <UncertaintyPerPost
        studyId={studyId}
        resultsUnit={resultsUnit}
        computedResults={computedResults}
        validatedOnly={validatedOnly}
      />
      <UncertaintyPerEmissionSource
        emissionSources={emissionSources}
        studyId={studyId}
        resultsUnit={resultsUnit}
        environment={environment}
        validatedOnly={validatedOnly}
      />
      <EmissionSourcePerPost
        studyId={studyId}
        resultsUnit={resultsUnit}
        results={computedResults}
        validatedOnly={validatedOnly}
      />
    </div>
  )
}

export default UncertaintyAnalytics
