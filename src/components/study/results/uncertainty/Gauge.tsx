import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import GaugeCharts from 'react-gauge-chart'
import styles from './Gauge.module.css'

interface Props {
  percent: number
}

const UncertaintyGauge = ({ percent }: Props) => {
  const t = useTranslations('study.results.uncertainties')

  return (
    <>
      <GaugeCharts
        id="uncertainty-gauge"
        percent={percent}
        arcsLength={[1.1199, 1.2621, 1.6361, 2.5164, 3]}
        colors={['#adc5f8', '#709af3', '#346fef', '#244da7', '#142c5f']}
        animate={false}
        arcPadding={0.02}
      />
      <div className={classNames(styles.labelContainer, 'flex-row justify-between')}>
        <p className="bold">{t('veryWeak')}</p>
        <p className="bold">{t('veryStrong')}</p>
      </div>
    </>
  )
}

export default UncertaintyGauge
