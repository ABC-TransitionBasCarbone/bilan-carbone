import { formatDifferenceTableEmissions } from '@/utils/exports'
import { formatNumber } from '@/utils/number'
import TrendingUpIcon from '@mui/icons-material/TrendingUpOutlined'
import { StudyResultUnit, SubPost } from '@repo/db-common'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './ConsolidatedExportDifference.module.css'

type Props = {
  difference: number
  resultsUnit: StudyResultUnit
  emissionSources: ReturnType<typeof formatDifferenceTableEmissions>
  studySite: string
  navigateToEmissionSource: (emissionSourceId: string, subPost: SubPost) => void
  title: string
  description: string
  columnTitle: string
}
export const ExportDifferenceTable = ({
  difference,
  resultsUnit,
  emissionSources,
  studySite,
  navigateToEmissionSource,
  title,
  description,
  columnTitle,
}: Props) => {
  const t = useTranslations('study.results.difference')
  const tUnits = useTranslations('study.results.units')
  const unit = tUnits(resultsUnit)

  return (
    <div className={styles.differenceCard}>
      <div className={classNames(styles.cardHeaderWithValue, 'align-center justify-between')}>
        <div className={classNames(styles.cardHeaderLeft, 'align-center')}>
          <TrendingUpIcon className={styles.cardIcon} />
          <h4>{t(title)}</h4>
        </div>
        <div className={'align-center'}>
          <span className={difference >= 0 ? styles.differenceValue : styles.differenceValueNegative}>
            {difference > 0 ? '+' : ''}
            {formatNumber(difference, 0)} {unit}
          </span>
        </div>
      </div>
      <div className={classNames(styles.cardContent, 'flex-col')}>
        <p className={styles.cardDescription}>{t(description)}</p>
        <div className={styles.wasteTable}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('tableHeaders.emissionSource')}</th>
                <th>{t('tableHeaders.post')}</th>
                <th>{t('tableHeaders.bilanCarbone')}</th>
                <th>{t(`tableHeaders.${columnTitle}`)}</th>
                <th>{t('tableHeaders.difference')}</th>
              </tr>
            </thead>
            <tbody>
              {emissionSources.map((item) => (
                <tr
                  key={`immobilisation-emission-source-${item.source.id}`}
                  className={styles.clickableRow}
                  onClick={() => navigateToEmissionSource(item.source.id, item.source.subPost)}
                >
                  <td className={styles.sourceName}>
                    {item.source.name}
                    {studySite === 'all' && ` (${item.source.studySite.site.name})`}
                  </td>
                  <td className={styles.sourcePost}>{item.post}</td>
                  <td className={styles.metricValue}>
                    {item.consolidatedValueToDisplay} {unit}
                  </td>
                  <td>
                    {item.exportValueToDisplay} {unit}
                  </td>
                  <td className={item.difference >= 0 ? styles.differenceCell : styles.differenceCellNegative}>
                    {item.difference > 0 ? '+' : ''}
                    {item.differenceToDisplay} {unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
