import BarChart from '@/components/study/charts/BarChart'
import PieChart from '@/components/study/charts/PieChart'
import { FullStudy } from '@/db/study'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'

interface Props {
  study: FullStudy
  studySite: string
  siteName: string
  tPdf: ReturnType<typeof useTranslations>
  isAll: boolean
  environment: Environment
}

export const ChartsPage = ({ study, studySite, siteName, tPdf, isAll, environment }: Props) => (
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
      />

      <PieChart
        study={study}
        studySite={studySite}
        height={400}
        showTitle={true}
        title={isAll ? tPdf('charts.allEmissions') : tPdf('charts.siteEmissions', { site: siteName })}
        showLabelsOnPie={true}
        validatedOnly={false}
        environment={environment}
        skipAnimation={true}
      />
    </div>
  </div>
)
