import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { StudyResultUnit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import progressStyles from '../../../base/ProgressBar.module.css'
import styles from './ConfidenceIntervalChart.module.css'
import commonStyles from './UncertaintyAnalytics.module.css'

interface Props {
  confidenceInterval: number[]
  unit: StudyResultUnit
  percent: number
}

const ConfidenceIntervalCharts = ({ confidenceInterval, unit, percent }: Props) => {
  const t = useTranslations('study.results.uncertainties')
  const tResultUnits = useTranslations('study.results.units')

  return (
    <div className="flex-col grow h100">
      <div className="grow align-center">
        <div className="flex-row relative grow">
          <div className="grow flex-col">
            <div className={classNames(styles.container, 'relative grow justify-end ml-4')}>
              <p className={classNames(styles.min, progressStyles[`w${percent.toFixed(0)}`], 'absolute bold')}>
                {formatNumber(confidenceInterval[0] / STUDY_UNIT_VALUES[unit])}
              </p>
              <div className={classNames(styles.bar, progressStyles[`w${percent.toFixed(0)}`])} />
            </div>
            <div className="flex-row justify-between pt025">
              <p className="bold">0</p>
            </div>
          </div>
          <p className={classNames(styles.max, 'relative bold')}>
            {formatNumber(confidenceInterval[1] / STUDY_UNIT_VALUES[unit])}
          </p>
        </div>
      </div>
      <div className={classNames('flex-cc mt1')}>
        <div className={classNames(commonStyles.title, 'grow')}>
          <p className="bold">
            {t('confidenceIntervalTitle')}, ({tResultUnits(unit)})
          </p>
        </div>
      </div>
    </div>
  )
}

export default ConfidenceIntervalCharts
