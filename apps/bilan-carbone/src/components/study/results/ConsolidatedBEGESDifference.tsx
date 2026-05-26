import { wasteEmissionFactors } from '@/constants/wasteEmissionFactors'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import type { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { PostInfos } from '@/services/results/exports'
import { getSiteEmissionSourcesWithoutMarketBase } from '@/services/results/utils'
import { ResultsByPost } from '@/types/study.types'
import { computeDifferenceForTableEmissions, formatDifferenceTableEmissions } from '@/utils/exports'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { Export, SubPost } from '@abc-transitionbascarbone/db-common/enums'
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import ConsolidatedExportDifference, { calculateEmissionSourcesDifference } from './ConsolidatedExportDifference'
import ExportDifferenceItems from './ExportDifferenceItems'
import { ExportDifferenceTable } from './ExportDifferenceTable'

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
    () => getSiteEmissionSourcesWithoutMarketBase(study.emissionSources, studySite),
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

    const filtered = wasteEmissionSources.filter(
      (emissionSource) =>
        (emissionSource.validated || !validatedOnly) && emissionSource.value && emissionSource.caracterisation,
    )
    return formatDifferenceTableEmissions(
      filtered,
      emissionFactorsWithParts,
      study.resultsUnit,
      environment,
      tPost,
      Export.Beges,
      study.startDate,
    )
  }, [
    wasteEmissionSources,
    emissionFactorsWithParts,
    study.resultsUnit,
    study.startDate,
    environment,
    tPost,
    validatedOnly,
  ])

  const wasteTotalDifference = useMemo(
    () => computeDifferenceForTableEmissions(wasteSourcesWithDifferences),
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
          exportType={Export.Beges}
          studySite={studySite}
          value={utilisationEnDependanceValueToDisplay}
          resultsUnit={study.resultsUnit}
          navigateToEmissionSource={navigateToEmissionSource}
        />
      )}

      {!!wasteSourcesWithDifferences.length && (
        <ExportDifferenceTable
          difference={wasteTotalDifference}
          resultsUnit={study.resultsUnit}
          emissionSources={wasteSourcesWithDifferences}
          studySite={studySite}
          navigateToEmissionSource={navigateToEmissionSource}
          title="wasteTitle"
          description="waste"
          columnTitle="beges"
        />
      )}

      {!!missingCaract.length && (
        <ExportDifferenceItems
          title="missingCaractTitle"
          descriptions={['missingCaract1', 'missingCaract2']}
          emissionSources={missingCaract}
          exportType={Export.Beges}
          studySite={studySite}
          value={formatNumber(missingCaractDifference, 0)}
          resultsUnit={study.resultsUnit}
          navigateToEmissionSource={navigateToEmissionSource}
          Icon={WarningAmberIcon}
        />
      )}
    </ConsolidatedExportDifference>
  )
}

export default ConsolatedBEGESDifference
