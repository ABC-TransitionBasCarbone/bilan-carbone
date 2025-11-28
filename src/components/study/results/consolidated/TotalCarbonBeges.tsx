import Box from '@/components/base/Box'
import Title from '@/components/base/Title'
import { formatNumber } from '@/utils/number'
import { StudyResultUnit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from '../ResultsContainer.module.css'
import Data from './Data'

interface Props {
  totalCarbon: number
  totalBeges: number
  resultUnit: StudyResultUnit
}
const TotalCarbonBeges = ({ totalCarbon, totalBeges, resultUnit }: Props) => {
  const t = useTranslations('study.results')
  const tResultUnits = useTranslations('study.results.units')

  return (
    <div className={classNames('justify-center flex-col mb2')}>
      <Title as="h3" title={t('total')} />
      <div className={classNames(styles.totalBegesGrid)}>
        <Box className="px2 pointer align-center flex-col relative" color="secondary">
          <Data value={formatNumber(totalCarbon)} label={tResultUnits(resultUnit)} testId="withDep-total-result" />
          <span className="align-center text-center">{t('bilanCarbone')}</span>
        </Box>
        <Box className="px2 pointer align-center flex-col" color="secondary">
          <Data value={formatNumber(totalBeges)} label={tResultUnits(resultUnit)} testId="withoutDep-total-result" />
          <span className="text-center">{t('beges')}</span>
        </Box>
      </div>
    </div>
  )
}

export default TotalCarbonBeges
