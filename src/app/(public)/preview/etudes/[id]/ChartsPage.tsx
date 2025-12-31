import BarChart from '@/components/study/charts/BarChart'
import PieChart from '@/components/study/charts/PieChart'
import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { getDetailedEmissionResults } from '@/services/study'
import { Translations } from '@/types/translation'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

interface Props {
  study: FullStudy
  studySite: string
  siteName: string
  tPdf: Translations
  isAll: boolean
  year?: string
  customPostOrder?: Post[]
}

export const ChartsPage = ({ study, studySite, siteName, tPdf, isAll, year = '', customPostOrder = [] }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const tStudyResults = useTranslations('study.results')

  const { computedResultsWithDep } = useMemo(
    () =>
      getDetailedEmissionResults(study, tPost, studySite, false, study.organizationVersion.environment, tStudyResults),
    [study, studySite, tPost, tStudyResults],
  )

  return (
    <div className="pdf-content page-break-before pdf-page-content">
      <div className="pdf-section">
        <h2 className={`pdf-${isAll ? 'totals' : 'cinema'}-header pdf-header-with-border`}>
          {isAll ? tPdf('charts.all') : tPdf('charts.site', { site: siteName })}
        </h2>

        <BarChart
          resultsUnit={study.resultsUnit}
          results={computedResultsWithDep}
          height={350}
          showTitle={true}
          title={isAll ? tPdf('charts.allEmissions') : tPdf('charts.siteEmissions', { site: siteName, year })}
          showLegend={false}
          showLabelsOnBars={true}
          skipAnimation={true}
          type="post"
          customOrder={customPostOrder}
        />

        <PieChart
          resultsUnit={study.resultsUnit}
          height={400}
          showTitle={true}
          title={isAll ? tPdf('charts.allEmissions') : tPdf('charts.siteEmissions', { site: siteName, year })}
          showLabelsOnPie={true}
          skipAnimation={true}
          results={computedResultsWithDep}
          showSubLevel={false}
          type="post"
        />
      </div>
    </div>
  )
}
