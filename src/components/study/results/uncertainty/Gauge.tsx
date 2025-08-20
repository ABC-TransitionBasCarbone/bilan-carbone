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

  return (
    <>
      <GaugeCharts
        id="uncertainty-gauge"
        percent={(uncertainty ?? 0) / (1.1119 + 1.2621 + 1.6361 + 2.5164 + 3)}
        arcsLength={[1.1199, 1.2621, 1.6361, 2.5164, 3]}
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
