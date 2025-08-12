import classNames from 'classnames'
import styles from './ConfidenceIntervalChart.module.css'
import { useTranslations } from 'next-intl'
import progressStyles from '../../../base/ProgressBar.module.css'
import { useMemo } from 'react'


interface Props {
    confidenceInterval: number[]
    totalCo2: number
}

const ConfidenceIntervalCharts = ({ confidenceInterval, totalCo2 }: Props) => {
    const t = useTranslations('study.results.uncertainties')
    const percent = useMemo(() => {
        const [min, max] = confidenceInterval

        const realPercent = ((max - min) / totalCo2) * 100

        if (realPercent > 100) {
            return 100
        }

        return realPercent 
    }, [confidenceInterval, totalCo2])

    console.log(progressStyles[`w${percent.toFixed(0)}`], `w${percent.toFixed(0)}`)

    return <div>
        <p className='mb-2'>{t('confidenceInterval')}</p>
        <div className={classNames(styles.container, 'flex grow flex-end')}>
            <div className={classNames(styles.bar, progressStyles[`w${percent.toFixed(0)}`])}></div>
        </div>
    </div>
}

export default ConfidenceIntervalCharts