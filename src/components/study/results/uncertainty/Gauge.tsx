import { uncertaintyValues } from '@/services/uncertainty'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import GaugeCharts from 'react-gauge-chart'
import styles from './Gauge.module.css'
import commonStyles from './UncertaintyAnalytics.module.css'

interface Props {
  uncertainty?: number
}

const UncertaintyGauge = ({ uncertainty }: Props) => {
  const t = useTranslations('study.results.uncertainties')
  const arcLength = [...uncertaintyValues, 3]

  return (
    <>
      <GaugeCharts
        id="uncertainty-gauge"
        percent={(uncertainty ?? 0) / arcLength.reduce((acc, current) => acc + current, 0)}
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
      <div className={classNames(commonStyles.titleContainer, 'mt1')}>
        <div className={classNames(commonStyles.title, 'grow')}>
          <p className="bold">{t('gaugeTitle')}</p>
        </div>
      </div>
    </>
  )
}

export default UncertaintyGauge
