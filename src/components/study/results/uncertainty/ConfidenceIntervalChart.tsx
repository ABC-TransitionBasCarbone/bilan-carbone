import Title from '@/components/base/Title'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { StudyResultUnit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import progressStyles from '../../../base/ProgressBar.module.css'
import styles from './ConfidenceIntervalChart.module.css'
interface Props {
  confidenceInterval: number[]
  totalCo2: number
  unit: StudyResultUnit
}

const ConfidenceIntervalCharts = ({ confidenceInterval, totalCo2, unit }: Props) => {
  const t = useTranslations('study.results.uncertainties')
  const tResultUnits = useTranslations('study.results.units')

  const percent = useMemo(() => {
    const [min, max] = confidenceInterval

    const realPercent = ((max - min) / max) * 100

    return realPercent
  }, [confidenceInterval])

  console.log(progressStyles[`w${percent.toFixed(0)}`], `w${percent.toFixed(0)}`)

  return (
    <>
      <Title as="h6" title={t('confidenceInterval')} />
      <div className="flex flex-row">
        <div className="grow flex-col">
          <div className={classNames(styles.container, 'flex grow justify-end ml-4')}>
            <div className={classNames(styles.bar, progressStyles[`w${percent.toFixed(0)}`])} />
          </div>
          <div className="flex flex-row justify-between">
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
    </>
  )
}

export default ConfidenceIntervalCharts
