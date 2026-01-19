import { wasteEmissionFactors } from '@/constants/wasteEmissionFactors'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { getEmissionResults } from '@/services/emissionSource'
import { Post } from '@/services/posts'
import { getBegesEmissionTotal } from '@/services/results/beges'
import { ResultsByPost } from '@/services/results/consolidated'
import { PostInfos } from '@/services/results/exports'
import { getSiteEmissionSources } from '@/services/results/utils'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import TrendingUpIcon from '@mui/icons-material/TrendingUpOutlined'
import { Export, SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import ConsolidatedExportDifference, { calculateEmissionSourcesDifference } from './ConsolidatedExportDifference'
import styles from './ConsolidatedExportDifference.module.css'
import ExportDifferenceItems from './ExportDifferenceItems'

interface Props {
  study: FullStudy
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
  consolidatedResults: ResultsByPost[]
  begesResults: PostInfos[]
  studySite: string
  navigateToEmissionSource: (emissionSourceId: string, subPost: SubPost) => void
}

const ConsolatedBEGESDifference = ({
  study,
  emissionFactorsWithParts,
  validatedOnly,
  consolidatedResults,
  begesResults,
  studySite,
  navigateToEmissionSource,
}: Props) => {
  const t = useTranslations('study.results.difference')
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')
  const unit = tUnits(study.resultsUnit)
  const unitValue = STUDY_UNIT_VALUES[study.resultsUnit]

  const environment = useMemo(() => study.organizationVersion.environment, [study])

  const emissionSourcesForSelectedSite = useMemo(
    () => getSiteEmissionSources(study.emissionSources, studySite),
    [study.emissionSources, studySite],
  )

  const utilisationEnDependanceInfos = consolidatedResults
    .find((result) => result.post === Post.UtilisationEtDependance)
    ?.children.find((subPost) => subPost.post === SubPost.UtilisationEnDependance)
  const hasUtilisationEnDependance = !!utilisationEnDependanceInfos && utilisationEnDependanceInfos.value !== 0
  // BEGES doesn't include "Utilisation en dépendance", BC does, so BEGES - BC = negative
  const utilisationEnDependanceValue = utilisationEnDependanceInfos
    ? -utilisationEnDependanceInfos.value / unitValue
    : 0
  const utilisationEnDependanceValueToDisplay = formatNumber(Math.round(utilisationEnDependanceValue), 0)

  // Find an emission source for the "en dépendance" sub-post to use in navigation
  const utilisationEnDependanceEmissionSources = useMemo(
    () =>
      emissionSourcesForSelectedSite.filter(
        (emissionSource) => emissionSource.subPost === SubPost.UtilisationEnDependance,
      ),
    [emissionSourcesForSelectedSite],
  )

  const wasteEmissionSources = useMemo(
    () =>
      emissionSourcesForSelectedSite.filter(
        (emissionSource) =>
          emissionSource.emissionFactor &&
          emissionSource.emissionFactor.importedId &&
          wasteEmissionFactors[emissionSource.emissionFactor.importedId],
      ),
    [emissionSourcesForSelectedSite],
  )

  const wasteSourcesWithDifferences = useMemo(() => {
    if (!wasteEmissionSources.length) {
      return []
    }

    return wasteEmissionSources
      .filter(
        (emissionSource) =>
          (emissionSource.validated || !validatedOnly) && emissionSource.value && emissionSource.caracterisation,
      )
      .map((emissionSource) => {
        const emissionFactor = emissionFactorsWithParts.find((ef) => ef.id === emissionSource.emissionFactor?.id)
        if (!emissionFactor || !emissionSource.value) {
          return null
        }

        const begesValue = getBegesEmissionTotal(emissionSource, emissionFactor) / unitValue
        const consolidatedValue = getEmissionResults(emissionSource, environment).emissionValue / unitValue
        const begesValueToDisplay = formatNumber(Math.round(begesValue), 0)
        const consolidatedValueToDisplay = formatNumber(Math.round(consolidatedValue), 0)
        const difference = begesValue - consolidatedValue

        return {
          source: emissionSource,
          post: tPost(emissionSource.subPost),
          difference,
          differenceToDisplay: formatNumber(Math.round(difference), 0),
          consolidatedValueToDisplay,
          begesValueToDisplay,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && Math.abs(Math.round(item.difference)) >= 1)
  }, [wasteEmissionSources, emissionFactorsWithParts, validatedOnly, tPost, unitValue, environment])

  const wasteTotalDifference = useMemo(
    () => wasteSourcesWithDifferences.reduce((total, item) => total + item.difference, 0),
    [wasteSourcesWithDifferences],
  )

  const missingCaract = useMemo(
    () =>
      emissionSourcesForSelectedSite.filter((emissionSource) => {
        if (
          (!emissionSource.validated && validatedOnly) ||
          emissionSource.subPost === SubPost.UtilisationEnDependance
        ) {
          return false
        }

        if (!emissionSource.caracterisation) {
          return true
        }

        return false
      }),
    [emissionSourcesForSelectedSite, validatedOnly],
  )

  const missingCaractDifference = useMemo(
    () => calculateEmissionSourcesDifference(missingCaract, emissionFactorsWithParts, environment, unitValue),
    [missingCaract, emissionFactorsWithParts, unitValue, environment],
  )

  return (
    <ConsolidatedExportDifference
      study={study}
      consolidatedResults={consolidatedResults}
      exportResults={begesResults}
      type={Export.Beges}
      exportDifference={utilisationEnDependanceValue + wasteTotalDifference + missingCaractDifference}
    >
      {hasUtilisationEnDependance && (
        <ExportDifferenceItems
          title="dependanceTitle"
          descriptions={['dependance']}
          emissionSources={utilisationEnDependanceEmissionSources}
          studySite={studySite}
          value={utilisationEnDependanceValueToDisplay}
          resultsUnit={study.resultsUnit}
          navigateToEmissionSource={navigateToEmissionSource}
        />
      )}

      {!!wasteSourcesWithDifferences.length && (
        <div className={styles.differenceCard}>
          <div className={classNames(styles.cardHeaderWithValue, 'align-center justify-between')}>
            <div className={classNames(styles.cardHeaderLeft, 'align-center')}>
              <TrendingUpIcon className={styles.cardIcon} />
              <h4>{t('wasteTitle')}</h4>
            </div>
            <div className={'align-center'}>
              <span className={wasteTotalDifference >= 0 ? styles.differenceValue : styles.differenceValueNegative}>
                {wasteTotalDifference > 0 ? '+' : ''}
                {formatNumber(wasteTotalDifference, 0)} {unit}
              </span>
            </div>
          </div>
          <div className={classNames(styles.cardContent, 'flex-col')}>
            <p className={styles.cardDescription}>{t('waste')}</p>
            <div className={styles.wasteTable}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('tableHeaders.emissionSource')}</th>
                    <th>{t('tableHeaders.post')}</th>
                    <th>{t('tableHeaders.bilanCarbone')}</th>
                    <th>{t('tableHeaders.beges')}</th>
                    <th>{t('tableHeaders.difference')}</th>
                  </tr>
                </thead>
                <tbody>
                  {wasteSourcesWithDifferences.map((item) => (
                    <tr
                      key={`waste-emission-source-${item.source.id}`}
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
                        {item.begesValueToDisplay} {unit}
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
      )}

      {!!missingCaract.length && (
        <ExportDifferenceItems
          title="missingCaractTitle"
          descriptions={['missingCaract1', 'missingCaract2']}
          emissionSources={missingCaract}
          studySite={studySite}
          value={formatNumber(missingCaractDifference, 0)}
          resultsUnit={study.resultsUnit}
          navigateToEmissionSource={navigateToEmissionSource}
        />
      )}
    </ConsolidatedExportDifference>
  )
}

export default ConsolatedBEGESDifference
