import { EmissionFactorWithParts } from '@/db/emissionFactors'
import type { FullStudy } from '@/db/study'
import { getEmissionResults } from '@/services/emissionSource'
import { Post } from '@/services/posts'
import { getDefaultRule, PostInfos } from '@/services/results/exports'
import { getGHGPEmissionValue, getLine } from '@/services/results/ghgp'
import { getAllSiteEmissionSources } from '@/services/results/utils'
import { ResultsByPost } from '@/types/study.types'
import { getEmissionFactor } from '@/utils/emissionSources'
import { computeDifferenceForTableEmissions, formatDifferenceTableEmissions } from '@/utils/exports'
import { formatNumber } from '@/utils/number'
import { hasDeprecationPeriod, hasFabricationPart, STUDY_UNIT_VALUES } from '@/utils/study'
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined'
import { ExportRule } from '@repo/db-common'
import {
  EmissionFactorBase,
  EmissionFactorPartType,
  EmissionSourceCaracterisation,
  Export,
  SubPost,
} from '@repo/db-common/enums'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import { EnergiesIcon } from '../infography/icons/energies'
import ConsolidatedExportDifference, { calculateEmissionSourcesDifference } from './ConsolidatedExportDifference'
import ExportDifferenceItems from './ExportDifferenceItems'
import { ExportDifferenceTable } from './ExportDifferenceTable'

interface Props {
  study: FullStudy
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
  consolidatedResults: ResultsByPost[]
  ghgpResults: PostInfos[]
  studySite: string
  ghgpRules: ExportRule[]
  navigateToEmissionSource: (emissionSourceId: string, subPost: SubPost) => void
  base: EmissionFactorBase
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
  base,
}: Props) => {
  const unitValue = STUDY_UNIT_VALUES[study.resultsUnit]
  const tPost = useTranslations('emissionFactors.post')
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

  const immobilisation = useMemo(() => {
    const filtered = emissionSourcesForSelectedSite.filter((emissionSource) => {
      if (isEmissionSourceFiltered(emissionSource)) {
        return false
      }

      return hasDeprecationPeriod(emissionSource.subPost)
    })

    return formatDifferenceTableEmissions(
      filtered,
      emissionFactorsWithParts,
      study.resultsUnit,
      environment,
      tPost,
      Export.GHGP,
      study.startDate,
    )
  }, [
    emissionFactorsWithParts,
    emissionSourcesForSelectedSite,
    environment,
    isEmissionSourceFiltered,
    study.resultsUnit,
    study.startDate,
    tPost,
  ])

  const immobilisationDifference = useMemo(() => computeDifferenceForTableEmissions(immobilisation), [immobilisation])

  const getOtherEmissions = useCallback(
    (isAmont: boolean) =>
      emissionSourcesForSelectedSite.filter((emissionSource) => {
        if (isEmissionSourceFiltered(emissionSource)) {
          return false
        }

        const subPostRules = ghgpRules.filter((rule) => rule.subPost === emissionSource.subPost)
        if (subPostRules.length === 0) {
          return false
        }
        const rule = getDefaultRule(subPostRules, emissionSource.caracterisation)

        if (isAmont) {
          return rule === '3.other'
        } else {
          return rule === '4.other'
        }
      }),
    [emissionSourcesForSelectedSite, ghgpRules, isEmissionSourceFiltered],
  )

  const otherEmissionsAval = useMemo(() => getOtherEmissions(false), [getOtherEmissions])

  const otherEmissionsAvalDifference = useMemo(
    () => calculateEmissionSourcesDifference(otherEmissionsAval, emissionFactorsWithParts, environment, unitValue),
    [otherEmissionsAval, emissionFactorsWithParts, unitValue, environment],
  )

  const otherEmissionsAmont = useMemo(() => getOtherEmissions(true), [getOtherEmissions])

  const otherEmissionsAmontDifference = useMemo(
    () => calculateEmissionSourcesDifference(otherEmissionsAmont, emissionFactorsWithParts, environment, unitValue),
    [otherEmissionsAmont, emissionFactorsWithParts, unitValue, environment],
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

  const marketBased = useMemo(
    () =>
      emissionSourcesForSelectedSite.filter((emissionSource) => {
        if (isEmissionSourceFiltered(emissionSource)) {
          return false
        }

        const emissionFactor = getEmissionFactor<EmissionFactorWithParts>(emissionSource, emissionFactorsWithParts)
        return emissionFactor && emissionFactor.base && emissionFactor.base === EmissionFactorBase.MarketBased
      }),
    [emissionFactorsWithParts, emissionSourcesForSelectedSite, isEmissionSourceFiltered],
  )

  const marketBasedDifference = useMemo(() => {
    if (base === EmissionFactorBase.LocationBased) {
      return 0
    }
    const locationBased = emissionSourcesForSelectedSite.filter((emissionSource) => {
      if (isEmissionSourceFiltered(emissionSource)) {
        return false
      }

      const emissionFactor = getEmissionFactor<EmissionFactorWithParts>(emissionSource, emissionFactorsWithParts)
      return emissionFactor && emissionFactor.base && emissionFactor.base === EmissionFactorBase.LocationBased
    })

    const locationBasedValue = locationBased.reduce(
      (total, emissionSource) => total + getEmissionResults(emissionSource, environment).emissionValue,
      0,
    )

    const marketBasedValue = marketBased.reduce(
      (total, emissionSource) => total + getEmissionResults(emissionSource, environment).emissionValue,
      0,
    )

    return (marketBasedValue - locationBasedValue) / unitValue
  }, [
    base,
    emissionSourcesForSelectedSite,
    marketBased,
    unitValue,
    isEmissionSourceFiltered,
    emissionFactorsWithParts,
    environment,
  ])

  const fabricationEmissionSources = useMemo(
    () =>
      emissionSourcesForSelectedSite.filter((emissionSource) => {
        if (isEmissionSourceFiltered(emissionSource)) {
          return false
        }

        return (
          hasFabricationPart(emissionSource.emissionFactor) &&
          emissionSource.caracterisation === EmissionSourceCaracterisation.Operated
        )
      }),
    [emissionSourcesForSelectedSite, isEmissionSourceFiltered, study.startDate],
  )

  const fabricationEmissionSourcesDifference = useMemo(() => {
    let value = 0
    fabricationEmissionSources.forEach((emissionSource) => {
      if (!emissionSource.emissionFactor || !emissionSource.value) {
        return
      }
      const id = emissionSource.emissionFactor.id
      const emissionFactor = emissionFactorsWithParts.find(
        (emissionFactorsWithParts) => emissionFactorsWithParts.id === id,
      )

      if (!emissionFactor || emissionFactor.emissionFactorParts.length === 0) {
        return
      }
      const parts = emissionFactor.emissionFactorParts.filter((p) => p.type === EmissionFactorPartType.Fabrication)
      parts.forEach((part) => {
        const emissionTotal = getGHGPEmissionValue(study.startDate)(emissionSource)
        value = value - getLine(emissionTotal, part).total / unitValue
      })
    })
    return value
  }, [fabricationEmissionSources, emissionFactorsWithParts, study.startDate, unitValue])

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
        otherEmissionsAvalDifference +
        otherEmissionsAmontDifference +
        otherGasDifference +
        marketBasedDifference +
        fabricationEmissionSourcesDifference
      }
    >
      {hasUtilisationEnDependance && (
        <ExportDifferenceItems
          title="dependanceGHGTitle"
          descriptions={['dependanceGHG']}
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
        <ExportDifferenceTable
          difference={immobilisationDifference}
          resultsUnit={study.resultsUnit}
          emissionSources={immobilisation}
          studySite={studySite}
          navigateToEmissionSource={navigateToEmissionSource}
          title="immobilisationTitle"
          description="immobilisation1"
          columnTitle="ghgp"
        />
      )}
      {!!otherEmissionsAval.length && (
        <ExportDifferenceItems
          title="otherEmissionsAvalTitle"
          descriptions={['otherEmissionsAval']}
          emissionSources={otherEmissionsAval}
          exportType={Export.GHGP}
          studySite={studySite}
          value={formatNumber(otherEmissionsAvalDifference, 0)}
          resultsUnit={study.resultsUnit}
          navigateToEmissionSource={navigateToEmissionSource}
        />
      )}
      {!!otherEmissionsAmont.length && (
        <ExportDifferenceItems
          title="otherEmissionsAmontTitle"
          descriptions={['otherEmissionsAmont']}
          emissionSources={otherEmissionsAmont}
          exportType={Export.GHGP}
          studySite={studySite}
          value={formatNumber(otherEmissionsAmontDifference, 0)}
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
      {marketBasedDifference > 0 && (
        <ExportDifferenceItems
          title="marketBasedTitle"
          descriptions={['marketBased']}
          emissionSources={marketBased}
          exportType={Export.GHGP}
          studySite={studySite}
          value={formatNumber(marketBasedDifference, 0)}
          resultsUnit={study.resultsUnit}
          navigateToEmissionSource={navigateToEmissionSource}
          Icon={EnergiesIcon}
        />
      )}
      {!!fabricationEmissionSources.length && (
        <ExportDifferenceItems
          title="fabricationTitle"
          descriptions={['fabrication']}
          emissionSources={fabricationEmissionSources}
          exportType={Export.GHGP}
          studySite={studySite}
          value={formatNumber(fabricationEmissionSourcesDifference, 0)}
          resultsUnit={study.resultsUnit}
          navigateToEmissionSource={navigateToEmissionSource}
        />
      )}
    </ConsolidatedExportDifference>
  )
}

export default ConsolatedGHGPDifference
