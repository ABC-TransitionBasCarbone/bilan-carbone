import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { getDefaultRule, PostInfos } from '@/services/results/exports'
import { getAllSiteEmissionSources } from '@/services/results/utils'
import { getEmissionFactor } from '@/utils/emissionSources'
import { formatNumber } from '@/utils/number'
import { hasDeprecationPeriod, STUDY_UNIT_VALUES } from '@/utils/study'
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined'
import { Export, ExportRule, SubPost } from '@prisma/client'
import { useCallback, useMemo } from 'react'
import ConsolidatedExportDifference, { calculateEmissionSourcesDifference } from './ConsolidatedExportDifference'
import ExportDifferenceItems from './ExportDifferenceItems'

interface Props {
  study: FullStudy
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
  consolidatedResults: ResultsByPost[]
  ghgpResults: PostInfos[]
  studySite: string
  ghgpRules: ExportRule[]
  navigateToEmissionSource: (emissionSourceId: string, subPost: SubPost) => void
}

const ConsolatedGHGPDifference = ({
  study,
  emissionFactorsWithParts,
  validatedOnly,
  consolidatedResults,
  ghgpResults,
  studySite,
  ghgpRules,
  navigateToEmissionSource,
}: Props) => {
  const unitValue = STUDY_UNIT_VALUES[study.resultsUnit]

  const environment = useMemo(() => study.organizationVersion.environment, [study])

  const emissionSourcesForSelectedSite = useMemo(
    () => getAllSiteEmissionSources(study.emissionSources, studySite),
    [study.emissionSources, studySite],
  )

  const utilisationEnDependanceInfos = consolidatedResults
    .find((result) => result.post === Post.UtilisationEtDependance)
    ?.children.find((subPost) => subPost.post === SubPost.UtilisationEnDependance)
  const hasUtilisationEnDependance = !!utilisationEnDependanceInfos && utilisationEnDependanceInfos.value !== 0
  // GHGP doesn't include "Utilisation en dépendance", BC does, so GHGP - BC = negative
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

  const isEmissionSourceFiltered = useCallback(
    (emissionSource: FullStudy['emissionSources'][number]) =>
      (!emissionSource.validated && validatedOnly) ||
      emissionSource.subPost === SubPost.UtilisationEnDependance ||
      !emissionSource.caracterisation,
    [validatedOnly],
  )

  const immobilisation = useMemo(
    () =>
      emissionSourcesForSelectedSite.filter((emissionSource) => {
        if (isEmissionSourceFiltered(emissionSource)) {
          return false
        }

        return (
          hasDeprecationPeriod(emissionSource.subPost) &&
          (!emissionSource.constructionYear ||
            emissionSource.constructionYear?.getFullYear() !== study.startDate.getFullYear())
        )
      }),
    [emissionSourcesForSelectedSite, isEmissionSourceFiltered, study.startDate],
  )

  console.log('immobilisation : ', immobilisation)

  const immobilisationDifference = useMemo(
    () => calculateEmissionSourcesDifference(immobilisation, emissionFactorsWithParts, environment, unitValue),
    [immobilisation, emissionFactorsWithParts, unitValue, environment],
  )

  const otherEmissions = useMemo(
    () =>
      emissionSourcesForSelectedSite.filter((emissionSource) => {
        if (isEmissionSourceFiltered(emissionSource)) {
          return false
        }

        const subPostRules = ghgpRules.filter((rule) => rule.subPost === emissionSource.subPost)
        if (subPostRules.length === 0) {
          return false
        }
        const rule = getDefaultRule(subPostRules, emissionSource.caracterisation)
        return rule && rule.includes('other')
      }),
    [emissionSourcesForSelectedSite, ghgpRules, isEmissionSourceFiltered],
  )

  const otherEmissionsDifference = useMemo(
    () => calculateEmissionSourcesDifference(otherEmissions, emissionFactorsWithParts, environment, unitValue),
    [otherEmissions, emissionFactorsWithParts, unitValue, environment],
  )

  const otherGas = useMemo(
    () =>
      emissionSourcesForSelectedSite.filter((emissionSource) => {
        if (isEmissionSourceFiltered(emissionSource)) {
          return false
        }

        const emissionFactor = getEmissionFactor<EmissionFactorWithParts>(emissionSource, emissionFactorsWithParts)
        return (
          !!emissionFactor?.otherGES ||
          emissionFactor?.emissionFactorParts.some((emissionFactorPart) => emissionFactorPart.otherGES)
        )
      }),
    [emissionFactorsWithParts, emissionSourcesForSelectedSite, isEmissionSourceFiltered],
  )

  const otherGasDifference = useMemo(() => {
    return otherGas.reduce((total, emissionSource) => {
      const emissionFactor = getEmissionFactor<EmissionFactorWithParts>(emissionSource, emissionFactorsWithParts)
      if (!emissionFactor || !emissionSource.value) {
        return total
      }

      const otherGasEmission = emissionFactor.emissionFactorParts.length
        ? emissionFactor.emissionFactorParts.reduce(
            (res, emissionFactorPart) => res + (emissionFactorPart.otherGES || 0) * (emissionSource.value || 0),
            0,
          )
        : emissionSource.value * (emissionFactor.otherGES || 0)

      return total - otherGasEmission / unitValue
    }, 0)
  }, [otherGas, emissionFactorsWithParts, unitValue])

  return (
    <ConsolidatedExportDifference
      study={study}
      consolidatedResults={consolidatedResults}
      exportResults={ghgpResults}
      type={Export.GHGP}
      exportDifference={
        utilisationEnDependanceValue +
        missingCaractDifference +
        immobilisationDifference +
        otherEmissionsDifference +
        otherGasDifference
      }
    >
      {hasUtilisationEnDependance && (
        <ExportDifferenceItems
          title="dependanceTitle"
          descriptions={['dependance']}
          emissionSources={utilisationEnDependanceEmissionSources}
          exportType={Export.GHGP}
          studySite={studySite}
          value={utilisationEnDependanceValueToDisplay}
          resultsUnit={study.resultsUnit}
          navigateToEmissionSource={navigateToEmissionSource}
        />
      )}
      {!!missingCaract.length && (
        <ExportDifferenceItems
          title="missingCaractTitle"
          descriptions={['missingCaract1', 'missingCaract2']}
          emissionSources={missingCaract}
          exportType={Export.GHGP}
          studySite={studySite}
          value={formatNumber(missingCaractDifference, 0)}
          resultsUnit={study.resultsUnit}
          navigateToEmissionSource={navigateToEmissionSource}
          Icon={WarningAmberIcon}
        />
      )}
      {!!immobilisation.length && (
        <ExportDifferenceItems
          title="immobilisationTitle"
          descriptions={['immobilisation1']}
          emissionSources={immobilisation}
          exportType={Export.GHGP}
          studySite={studySite}
          value={formatNumber(immobilisationDifference, 0)}
          resultsUnit={study.resultsUnit}
          navigateToEmissionSource={navigateToEmissionSource}
        />
      )}
      {!!otherEmissions.length && (
        <ExportDifferenceItems
          title="otherEmissionsTitle"
          descriptions={['otherEmissions1']}
          emissionSources={otherEmissions}
          exportType={Export.GHGP}
          studySite={studySite}
          value={formatNumber(otherEmissionsDifference, 0)}
          resultsUnit={study.resultsUnit}
          navigateToEmissionSource={navigateToEmissionSource}
        />
      )}
      {!!otherGas.length && (
        <ExportDifferenceItems
          title="otherGasTitle"
          descriptions={['otherGas1']}
          emissionSources={otherGas}
          exportType={Export.GHGP}
          studySite={studySite}
          value={formatNumber(otherGasDifference, 0)}
          resultsUnit={study.resultsUnit}
          navigateToEmissionSource={navigateToEmissionSource}
        />
      )}
    </ConsolidatedExportDifference>
  )
}

export default ConsolatedGHGPDifference
