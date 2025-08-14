import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { StudyResultUnit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import progressStyles from '../../../base/ProgressBar.module.css'
import styles from './ConfidenceIntervalChart.module.css'
interface Props {
  confidenceInterval: number[]
  unit: StudyResultUnit
  percent: number
}

const ConfidenceIntervalCharts = ({ confidenceInterval, unit, percent }: Props) => {
  const t = useTranslations('study.results.uncertainties')
  const tResultUnits = useTranslations('study.results.units')

  return (
    <div className="flex-row">
      <div className="grow flex-col">
        <div className={classNames(styles.titleContainer, 'mb1')}>
          <div className={styles.title}>
            <p className="bold">{t('confidenceInterval')}</p>
          </div>
        </div>
        <div className={classNames(styles.container, 'grow justify-end ml-4')}>
          <div className={classNames(styles.bar, progressStyles[`w${percent.toFixed(0)}`])} />
        </div>
        <div className="flex-row justify-between">
          <p className="bold">0</p>
          <p className={classNames(styles.min, progressStyles[`w${percent.toFixed(0)}`], 'bold')}>
            {formatNumber(confidenceInterval[0] / STUDY_UNIT_VALUES[unit])}
          </p>
        </div>
      </div>
      <p className={classNames(styles.max, 'bold')}>
        {formatNumber(confidenceInterval[1] / STUDY_UNIT_VALUES[unit])} ({tResultUnits(unit)})
      </p>
    </div>
  )
}

export default ConfidenceIntervalCharts
