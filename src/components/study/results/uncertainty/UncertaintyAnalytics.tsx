import Block from '@/components/base/Block'
import { FullStudy } from '@/db/study'
import { environmentPostMapping } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { ResultType } from '@/services/study'
import { Environment } from '@prisma/client'
import { useTranslations } from "next-intl"
import ConfidenceIntervalCharts from './ConfidenceIntervalChart'
import { getEmissionSourcesGlobalUncertainty } from '@/services/uncertainty'

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

    return <Block title={t('title')} as='h4'>
      <ConfidenceIntervalCharts confidenceInterval={confidenceInterval} totalCo2={total} />
    </Block>
}

export default UncertaintyAnalytics
