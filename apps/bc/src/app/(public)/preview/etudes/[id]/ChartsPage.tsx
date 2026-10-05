import type { BaseResultsByPost } from '@/services/posts'
import { BarChart, PieChart } from '@abc-transitionbascarbone/application/ui'
import { StudyResultUnit } from '@abc-transitionbascarbone/db/enums'
import { Translations } from '@abc-transitionbascarbone/shared'

interface Props {
  results: BaseResultsByPost[]
  studyResultUnit: StudyResultUnit
  siteName: string
  tPdf: Translations
  isAll: boolean
  year?: string
}

export const ChartsPage = ({ results, studyResultUnit, siteName, tPdf, isAll, year = '' }: Props) => {
  return (
    <div className="pdf-content page-break-before pdf-page-content">
      <div className="pdf-section">
        <h2 className={`pdf-${isAll ? 'totals' : 'cinema'}-header pdf-header-with-border`}>
          {isAll ? tPdf('charts.all') : tPdf('charts.site', { site: siteName })}
        </h2>

        <BarChart
          resultsUnit={studyResultUnit}
          results={results}
          height={350}
          showTitle={true}
          title={isAll ? tPdf('charts.allEmissions') : tPdf('charts.siteEmissions', { site: siteName, year })}
          showLegend={false}
          showLabelsOnBars={true}
          skipAnimation={true}
          type="post"
        />

        <PieChart
          resultsUnit={studyResultUnit}
          height={400}
          showTitle={true}
          title={isAll ? tPdf('charts.allEmissions') : tPdf('charts.siteEmissions', { site: siteName, year })}
          showLabelsOnPie={true}
          skipAnimation={true}
          results={results}
          showSubLevel={false}
          type="post"
        />
      </div>
    </div>
  )
}
