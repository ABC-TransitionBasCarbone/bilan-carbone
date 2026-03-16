import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import DynamicAllResults from '@/environments/core/study/results/DynamicAllResults'
import { addUserChecklistItem } from '@/services/serverFunctions/user'
import { ExportRule, SiteCAUnit, UserChecklist } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
  caUnit?: SiteCAUnit
}

const ResultsPage = ({ study, rules, emissionFactorsWithParts, validatedOnly, caUnit }: Props) => {
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')

  addUserChecklistItem(UserChecklist.ConsultResults)

  return (
    <>
      <Breadcrumbs
        current={tStudyNav('results')}
        links={[
          { label: tNav('home'), link: '/' },
          study.organizationVersion.isCR
            ? {
                label: study.organizationVersion.organization.name,
                link: `/organisations/${study.organizationVersion.id}`,
              }
            : undefined,
          { label: study.name, link: `/etudes/${study.id}` },
        ].filter((link) => link !== undefined)}
      />
      <DynamicAllResults
        emissionFactorsWithParts={emissionFactorsWithParts}
        rules={rules}
        study={study}
        validatedOnly={validatedOnly}
        caUnit={caUnit}
      />
    </>
  )
}

export default ResultsPage
