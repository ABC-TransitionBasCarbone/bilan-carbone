import BarChart from '@/components/study/charts/BarChart'
import PieChart from '@/components/study/charts/PieChart'
import { FullStudy } from '@/db/study'
import { getResultsValues } from '@/services/study'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

interface Props {
  study: FullStudy
  studySite: string
  siteName: string
  tPdf: ReturnType<typeof useTranslations>
  isAll: boolean
  environment: Environment
}

export const ChartsPage = ({ study, studySite, siteName, tPdf, isAll, environment }: Props) => {
  const tPost = useTranslations('emissionFactors.post')

  const { computedResultsWithDep } = useMemo(
    () => getResultsValues(study, tPost, studySite, false, study.organizationVersion.environment),
    [study, studySite, tPost],
  )

  return (
    <div className="pdf-content page-break-before pdf-page-content">
      <div className="pdf-section">
        <h2 className={`pdf-${isAll ? 'totals' : 'cinema'}-header pdf-header-with-border`}>
          {isAll ? tPdf('charts.all') : tPdf('charts.site', { site: siteName })}
        </h2>

        <BarChart
          study={study}
          studySite={studySite}
          height={350}
          showTitle={true}
          title={isAll ? tPdf('charts.allEmissions') : tPdf('charts.siteEmissions', { site: siteName })}
          showLegend={false}
          showLabelsOnBars={true}
          validatedOnly={false}
          environment={environment}
          skipAnimation={true}
          withDep
        />

        <PieChart
          resultsUnit={study.resultsUnit}
          height={400}
          showTitle={true}
          title={isAll ? tPdf('charts.allEmissions') : tPdf('charts.siteEmissions', { site: siteName })}
          showLabelsOnPie={true}
          skipAnimation={true}
          results={computedResultsWithDep}
        />
      </div>
    </div>
  )
}
