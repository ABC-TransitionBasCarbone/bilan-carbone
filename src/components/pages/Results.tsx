import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { ExportRule } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import ResultsTables from '../study/results/ResultsTables'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
}

const ResultsPage = ({ study, rules, emissionFactorsWithParts }: Props) => {
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')

  return (
    <>
      <Breadcrumbs
        current={tStudyNav('results')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
        ]}
      />
      <Block title={tStudyNav('results')} as="h1">
        <ResultsTables study={study} rules={rules} emissionFactorsWithParts={emissionFactorsWithParts} />
      </Block>
    </>
  )
}

export default ResultsPage
