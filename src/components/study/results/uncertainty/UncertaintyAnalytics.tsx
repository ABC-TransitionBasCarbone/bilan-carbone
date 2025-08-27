import Title from '@/components/base/Title'
import { FullStudy } from '@/db/study'
import { ResultsByPost } from '@/services/results/consolidated'
import { getEmissionSourcesGlobalUncertainty } from '@/services/uncertainty'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import ConfidenceIntervalCharts from './ConfidenceIntervalChart'
import UncertaintyGauge from './Gauge'
import MostUncertainPostsChart from './MostUncertainPostsChart'
import styles from './UncertaintyAnalytics.module.css'
import UncertaintyPerEmissionSource from './UncertaintyPerEmissionSource'
import UncertaintyPerPost from './UncertaintyPerPost'

interface Props {
  study: FullStudy
  environment: Environment
  computedResults: ResultsByPost[]
}

const UncertaintyAnalytics = ({ study, environment, computedResults }: Props) => {
  const t = useTranslations('study.results.uncertainties')

  const confidenceInterval = getEmissionSourcesGlobalUncertainty(study.emissionSources, environment)
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
      <Title title={t('title')} as="h4" />
      <div className={styles.container}>
        <div className="grow flex-cc">
          <ConfidenceIntervalCharts
            confidenceInterval={confidenceInterval}
            unit={study.resultsUnit}
            percent={percent}
          />
        </div>
        <div className={classNames(styles.container2, 'grow2 flex-cc')}>
          <UncertaintyGauge uncertainty={computedResults.find((res) => res.post === 'total')?.uncertainty} />
          <MostUncertainPostsChart computedResults={computedResults} />
        </div>
      </div>
      <UncertaintyPerPost study={study} computedResults={computedResults} />
      <UncertaintyPerEmissionSource study={study} />
    </div>
  )
}

export default UncertaintyAnalytics
