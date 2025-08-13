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

    const realPercent = ((max - min) / max) * 100

    return realPercent
  }, [confidenceInterval])

  const computedResults = computeResultsByPost(
    study,
    tPost,
    studySite,
    true,
    validatedOnly,
    environmentPostMapping[environment || Environment.BC],
    environment,
  )

  const total = computedResults?.find((post) => post.post === 'total')?.value ?? 1

  return (
    <Block title={t('title')} as="h4">
      <div className="flex flex-row">
        <div className="grow">
          <ConfidenceIntervalCharts
            confidenceInterval={confidenceInterval}
            totalCo2={total}
            unit={study.resultsUnit}
            percent={percent}
          />
        </div>
        <div className="grow2">
          <UncertaintyGauge percent={percent} />
        </div>
      </div>
    </Block>
  )
}

export default UncertaintyAnalytics
