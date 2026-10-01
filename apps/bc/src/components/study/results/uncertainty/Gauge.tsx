import { uncertaintyValues } from '@/services/uncertainty'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import GaugeCharts from 'react-gauge-chart'
import styles from './Gauge.module.css'
import commonStyles from './UncertaintyAnalytics.module.css'

interface Props {
  squaredStandardDeviation?: number
}

const UncertaintyGauge = ({ squaredStandardDeviation }: Props) => {
  const t = useTranslations('study.results.uncertainties')
  const refUncertainties = useMemo(() => [1, ...uncertaintyValues, 3.4], [])
  const arcLength = useMemo(() => {
    const res = []
    for (let i = 0; i <= refUncertainties.length - 2; i++) {
      res.push(refUncertainties[i + 1] - refUncertainties[i])
    }
    return res
  }, [refUncertainties])

  return (
    <div className="grow">
      <GaugeCharts
        id="uncertainty-gauge"
        percent={((squaredStandardDeviation || 1) - 1) / (refUncertainties[refUncertainties.length - 1] - 1)}
        arcsLength={arcLength}
        colors={['#adc5f8', '#709af3', '#346fef', '#244da7', '#142c5f']}
        animate={false}
        arcPadding={0.02}
        hideText
      />
      <div className={classNames(styles.labelContainer, 'flex-row justify-between')}>
        <p className="bold">{t('veryWeak')}</p>
        <p className="bold">{t('veryStrong')}</p>
      </div>
      <div className={classNames(commonStyles.titleContainer, 'flex-cc mt1')}>
        <div className={classNames(commonStyles.title, 'grow')}>
          <p className="bold">{t('gaugeTitle')}</p>
        </div>
      </div>
    </div>
  )
}

export default UncertaintyGauge
