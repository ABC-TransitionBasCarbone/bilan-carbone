import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { getUserSettings } from '@/services/serverFunctions/user'
import { ExportRule } from '@prisma/client'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import AllResults from '../study/results/AllResults'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
}

const ResultsPage = async ({ study, rules, emissionFactorsWithParts }: Props) => {
  const tNav = await getTranslations('nav')
  const tStudyNav = await getTranslations('study.navigation')
  const userSettings = await getUserSettings()

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
          unit={userSettings?.studyUnit}
        />
      </Block>
    </>
  )
}

export default ResultsPage
