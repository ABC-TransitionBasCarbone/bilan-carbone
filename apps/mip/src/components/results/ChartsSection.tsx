'use client'

import { StudyResultUnit } from '@abc-transitionbascarbone/db-common/enums'
import { BarChart, PieChart } from '@abc-transitionbascarbone/ui'
import { BasicTypeCharts, STUDY_UNIT_VALUES } from '@abc-transitionbascarbone/utils/charts'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './ChartsSection.module.css'

interface Props {
  pieChartItems: BasicTypeCharts[]
  barChartItems: BasicTypeCharts[]
  averageFootprint: number
  totalRespondents: number
}

const ChartsSection = ({ pieChartItems, barChartItems, averageFootprint, totalRespondents }: Props) => {
  const t = useTranslations('results')

  const postColorClassByKey: Record<string, string> = {
    commute: styles.postDetailColorCommute,
    travel: styles.postDetailColorTravel,
    food: styles.postDetailColorFood,
    digital: styles.postDetailColorDigital,
    office: styles.postDetailColorOffice,
  }

  const peopleEquivalentByPost = pieChartItems.map((item) => {
    const tco2e = item.value / STUDY_UNIT_VALUES[StudyResultUnit.T]

    return {
      key: item.post,
      label: item.label,
      tco2e,
      colorClassName: (item.post && postColorClassByKey[item.post]) ?? styles.postDetailColorNeutral,
    }
  })

  const peopleByLabel = new Map(peopleEquivalentByPost.map((post) => [post.label, post.tco2e]))

  return (
    <section className="mb2">
      <Typography variant="h6" className="mb1">
        {t('charts.title')}
      </Typography>
      <div className={classNames(styles.chartsGrid, 'gapped1')}>
        <BarChart
          results={barChartItems}
          resultsUnit={StudyResultUnit.T}
          title={t('charts.barTitle')}
          showLegend={false}
          type="post"
        />
        <PieChart
          resultsUnit={StudyResultUnit.T}
          showTitle
          title={t('charts.pieTitle')}
          showLabelsOnPie
          skipAnimation
          results={pieChartItems}
          type="post"
          tooltipValueFormatter={({ label, value }) =>
            t('charts.postDetailHover', {
              tco2e: formatNumber(value, 1),
              people: formatNumber(peopleByLabel.get(label) ?? 0, 0),
            })
          }
        />
      </div>
    </section>
  )
}

export default ChartsSection
