import Block from '@/components/base/Block'
import { FullStudy } from '@/db/study'
import { environmentPostMapping } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { ResultType } from '@/services/study'
import { getEmissionSourcesGlobalUncertainty } from '@/services/uncertainty'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import ConfidenceIntervalCharts from './ConfidenceIntervalChart'
import UncertaintyGauge from './Gauge'
import MostUncertainPostsChart from './MostUncertainPostsChart'

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
    <Block title={t('title')} as="h4" className="flex-col my2">
      <div className="flex-row">
        <div className="grow">
          <ConfidenceIntervalCharts
            confidenceInterval={confidenceInterval}
            unit={study.resultsUnit}
            percent={percent}
          />
        </div>
        <div className="grow2 flex-row">
          <div className="grow">
            <UncertaintyGauge percent={percent} />
          </div>
          <div className="grow">
            <MostUncertainPostsChart computedResults={computedResults} />
          </div>
        </div>
      </div>
    </Block>
  )
}

export default UncertaintyAnalytics
