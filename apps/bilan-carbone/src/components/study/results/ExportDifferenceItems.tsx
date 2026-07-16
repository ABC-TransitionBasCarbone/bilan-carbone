import type { FullStudy } from '@/db/study'
import { Export, StudyResultUnit, SubPost } from '@abc-transitionbascarbone/db-common'
import { customRich } from '@abc-transitionbascarbone/i18n/customRich'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import TrendingUpIcon from '@mui/icons-material/TrendingUpOutlined'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { EmissionSourceList } from './ConsolidatedExportDifference'
import styles from './ConsolidatedExportDifference.module.css'

interface Props {
  title: string
  descriptions: string[]
  emissionSources: FullStudy['emissionSources']
  exportType: Export
  studySite: string
  value: number
  resultsUnit: StudyResultUnit
  navigateToEmissionSource: (emissionSourceId: string, subPost: SubPost) => void
  Icon?: React.ElementType
}

const ExportDifferenceItems = ({
  title,
  descriptions,
  emissionSources,
  exportType,
  studySite,
  value,
  resultsUnit,
  navigateToEmissionSource,
  Icon = TrendingUpIcon,
}: Props) => {
  const t = useTranslations('study.results.difference')
  const tUnits = useTranslations('study.results.units')
  const unit = tUnits(resultsUnit)

  return (
    <>
      <div className={styles.differenceCard}>
        <div className={classNames(styles.cardHeaderWithValue, 'align-center justify-between')}>
          <div className={classNames(styles.cardHeaderLeft, 'align-center')}>
            <Icon className={styles.cardIcon} />
            <h4>{customRich(t, title)}</h4>
          </div>
          <div className={'align-center'}>
            <span className={value >= 0 ? styles.differenceValue : styles.differenceValueNegative}>
              {value > 0 ? '+' : ''}
              {formatNumber(value, 0)} {unit}
            </span>
          </div>
        </div>
        <div className={classNames(styles.cardContent, 'flex-col')}>
          <p className={styles.cardDescription}>
            {descriptions.map((description, i) => (
              <>
                <span key={i}>{customRich(t, description, { type: exportType })}</span>
                {i < descriptions.length - 1 && <br />}
              </>
            ))}
          </p>
          <EmissionSourceList
            studySite={studySite}
            emissionSources={emissionSources}
            onClick={navigateToEmissionSource}
          />
        </div>
      </div>
    </>
  )
}

export default ExportDifferenceItems
