import Title from '@/components/base/Title'
import { FullStudy } from '@/db/study'
import { environmentPostMapping } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { ResultType } from '@/services/study'
import { getEmissionSourcesGlobalUncertainty } from '@/services/uncertainty'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import ConfidenceIntervalCharts from './ConfidenceIntervalChart'
import UncertaintyGauge from './Gauge'
import MostUncertainPostsChart from './MostUncertainPostsChart'
import styles from './UncertaintyAnalytics.module.css'

interface Props {
  study: FullStudy
  studySite: string
  withDependencies: boolean
  validatedOnly: boolean
  environment: Environment
  type?: ResultType
}

const UncertaintyAnalytics = ({ study, studySite, withDependencies, validatedOnly, environment, type }: Props) => {
  const t = useTranslations('study.results.uncertainties')
  const tPost = useTranslations('emissionFactors.post')

  const confidenceInterval = getEmissionSourcesGlobalUncertainty(study.emissionSources, environment)
  const percent = useMemo(() => {
    const [min, max] = confidenceInterval

    if (min === 0 && max === 0) {
      return 0
    }
    const realPercent = ((max - min) / max) * 100

    return realPercent
  }, [confidenceInterval])

  const computedResults = computeResultsByPost(
    study,
    tPost,
    studySite,
    withDependencies,
    validatedOnly,
    environmentPostMapping[environment || Environment.BC],
    environment,
    type,
  )

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
    </div>
  )
}

export default UncertaintyAnalytics
