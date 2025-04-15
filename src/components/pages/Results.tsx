import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { addUserChecklistItem } from '@/services/serverFunctions/user'
import { ExportRule, UserChecklist } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import AllResults from '../study/results/AllResults'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
}

const ResultsPage = ({ study, rules, emissionFactorsWithParts, validatedOnly }: Props) => {
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')

  addUserChecklistItem(UserChecklist.ConsultResults)

  return (
    <>
      <Breadcrumbs
        current={tStudyNav('results')}
        links={[
          { label: tNav('home'), link: '/' },
          study.organization.isCR
            ? {
                label: study.organization.name,
                link: `/organisations/${study.organization.id}`,
              }
            : undefined,
          { label: study.name, link: `/etudes/${study.id}` },
        ].filter((link) => link !== undefined)}
      />
      <Block title={tStudyNav('results')} as="h1">
        <AllResults
          study={study}
          rules={rules}
          emissionFactorsWithParts={emissionFactorsWithParts}
          validatedOnly={validatedOnly}
        />
      </Block>
    </>
  )
}

export default ResultsPage
