'use client'

import Block from '@/components/base/Block'
import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { download } from '@/services/file'
import { hasAccessToBcExport, hasAccessToDownloadStudyEmissionSourcesButton } from '@/services/permissions/environment'
import { environmentPostMapping } from '@/services/posts'
import { computeBegesResult } from '@/services/results/beges'
import { computeResultsByPost, computeResultsByTag } from '@/services/results/consolidated'
import { computeGHGPResult } from '@/services/results/ghgp'
import { getSiteEmissionSourcesWithoutMarketBase } from '@/services/results/utils'
import { isDeactivableFeatureActiveForEnvironment } from '@/services/serverFunctions/deactivableFeatures'
import { prepareReport } from '@/services/serverFunctions/study'
import {
  AdditionalResultTypes,
  downloadStudyEmissionSources,
  downloadStudyResults,
  getDetailedEmissionResults,
  ResultType,
} from '@/services/study'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { getPost } from '@/utils/post'
import { calculateMonetaryRatio, convertValue } from '@/utils/study'
import DownloadIcon from '@mui/icons-material/Download'
import SummarizeIcon from '@mui/icons-material/Summarize'
import { FormControl, InputLabel, MenuItem, Select, Tab, Tabs } from '@mui/material'
import {
  ControlMode,
  DeactivatableFeature,
  EmissionFactorBase,
  Environment,
  Export,
  ExportRule,
  SiteCAUnit,
  StudyResultUnit,
  SubPost,
} from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'
import ElectricityBaseDifference from '../ElectricityBaseDifference'
import SelectStudySite from '../site/SelectStudySite'
import useStudySite from '../site/useStudySite'
import BegesResultsTable from './beges/BegesResultsTable'
import ConsolidatedResults from './consolidated/ConsolidatedResults'
import EmissionsAnalysis from './consolidated/EmissionsAnalysis'
import ConsolatedBEGESDifference from './ConsolidatedBEGESDifference'
import ConsolatedGHGPDifference from './ConsolidatedGHGPDifference'
import GHGPResultsTable from './ghgp/GHGPResultsTable'
import ResultFilters from './ResultFilters'
import UncertaintyAnalytics from './uncertainty/UncertaintyAnalytics'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
  caUnit?: SiteCAUnit
}

const AllResults = ({ study, rules, emissionFactorsWithParts, validatedOnly, caUnit }: Props) => {
  const t = useTranslations('study.results')
  const { callServerFunction } = useServerFunction()
  const tOrga = useTranslations('study.organization')
  const tPost = useTranslations('emissionFactors.post')
  const tUnit = useTranslations('units')
  const tExport = useTranslations('exports')
  const tQuality = useTranslations('quality')
  const tBeges = useTranslations('beges')
  const tGHGP = useTranslations('ghgp')
  const tUnits = useTranslations('study.results.units')
  const tResultUnits = useTranslations('study.results.units')
  const tStudyExport = useTranslations('study.export')
  const tCaracterisations = useTranslations('categorisations')
  const tStudyNav = useTranslations('study.navigation')
  const tBase = useTranslations('emissionFactors.base')
  const { environment } = useAppEnvironmentStore()
  const [type, setType] = useState<ResultType>(AdditionalResultTypes.CONSOLIDATED)
  const exports = useMemo(() => study.exports, [study.exports])
  const [isDownloadReportActive, setIsDownloadReportActive] = useState(false)
  const [selectedSubposts, setSelectedSubposts] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedGHGPTable, setSelectedGHGPTable] = useState<EmissionFactorBase>(EmissionFactorBase.LocationBased)
  const router = useRouter()

  useEffect(() => {
    if (environment && environment !== Environment.BC) {
      setType(AdditionalResultTypes.ENV_SPECIFIC_EXPORT)
    }
  }, [environment])

  useEffect(() => {
    const checkDownloadReportFeature = async () => {
      if (environment) {
        callServerFunction(
          () => isDeactivableFeatureActiveForEnvironment(DeactivatableFeature.DownloadReport, environment),
          {
            onSuccess: (data) => {
              setIsDownloadReportActive(data)
            },
          },
        )
      }
    }
    checkDownloadReportFeature()
  }, [environment, callServerFunction])

  const { studySite, setSite } = useStudySite(study, true)

  const begesRules = useMemo(() => rules.filter((rule) => rule.export === Export.Beges), [rules])
  const ghgpRules = useMemo(() => rules.filter((rule) => rule.export === Export.GHGP), [rules])

  const allowTypeSelect = useMemo(() => {
    if (exports && exports.types.length > 0) {
      return true
    }
    if (environment && hasAccessToBcExport(environment)) {
      return true
    }
    return false
  }, [environment, exports])

  // Get withDepValue for BEGES table (only needed if BEGES export exists)
  const { withDepValue } = useMemo(() => {
    if (!exports?.types?.includes(Export.Beges)) {
      return { withDepValue: 0 }
    }
    return getDetailedEmissionResults(
      study,
      tPost,
      studySite,
      !!validatedOnly,
      study.organizationVersion.environment,
      t,
      true,
      type,
    )
  }, [study, studySite, t, tPost, type, validatedOnly, exports])

  const {
    withDepForced,
    withoutDepForced,
    filteredResultsByPost,
    filteredResultsByTag,
    filteredEmissionSources,
    monetaryRatio,
    nonSpecificMonetaryRatio,
  } = useMemo(() => {
    if (selectedSubposts.length === 0 && selectedTags.length === 0) {
      // No results shown when no filters are selected
      return {
        withDepForced: 0,
        withoutDepForced: 0,
        filteredResultsByPost: [],
        filteredResultsByTag: [],
        filteredEmissionSources: [],
        monetaryRatio: 0,
        nonSpecificMonetaryRatio: 0,
      }
    }

    // Filter emission sources by selected subposts and tags
    const siteEmissionSources = getSiteEmissionSourcesWithoutMarketBase(study.emissionSources, studySite)

    // Helper function to filter emission sources
    const filterEmissionSources = (
      emissionSource: (typeof siteEmissionSources)[number],
      utilisationEnDependanceMode: 'normal' | 'forceInclude' | 'forceExclude',
    ): boolean => {
      const isUtilisationEnDependance = emissionSource.subPost === SubPost.UtilisationEnDependance

      if (isUtilisationEnDependance) {
        if (utilisationEnDependanceMode === 'forceInclude') {
          return true
        }
        if (utilisationEnDependanceMode === 'forceExclude') {
          return false
        }
        // 'normal' mode: continue with normal filtering
      }

      const subPostStr = String(emissionSource.subPost)
      const matchesSubPost = selectedSubposts.length > 0 && selectedSubposts.includes(subPostStr)

      const hasNoTags = emissionSource.emissionSourceTags.length === 0
      const hasSomeSelectedTag = emissionSource.emissionSourceTags.some((est) => selectedTags.includes(est.tag.name))
      const untaggedLabelSelected = selectedTags.includes('other')
      const matchesTag = (hasNoTags && untaggedLabelSelected) || hasSomeSelectedTag

      return matchesSubPost && matchesTag
    }

    // Real filtered values
    const filteredEmissionSources = siteEmissionSources.filter((es) => filterEmissionSources(es, 'normal'))
    const filteredStudy = { ...study, emissionSources: filteredEmissionSources }

    // Exclude UtilisationEnDependance even if it matches filters
    const filteredEmissionSourcesWithoutDepForced = siteEmissionSources.filter((es) =>
      filterEmissionSources(es, 'forceExclude'),
    )
    const filteredStudyWithoutDepForced = { ...study, emissionSources: filteredEmissionSourcesWithoutDepForced }

    // Include UtilisationEnDependance even if not in filters
    const filteredEmissionSourcesWithDepForced = siteEmissionSources.filter((es) =>
      filterEmissionSources(es, 'forceInclude'),
    )
    const filteredStudyWithDepForced = { ...study, emissionSources: filteredEmissionSourcesWithDepForced }

    const filteredResultWithDep = computeResultsByPost(
      filteredStudyWithDepForced,
      tPost,
      studySite,
      true,
      !!validatedOnly,
      environmentPostMapping[study.organizationVersion.environment],
      study.organizationVersion.environment,
      type,
    )

    const filteredResultWithoutDep = computeResultsByPost(
      filteredStudyWithoutDepForced,
      tPost,
      studySite,
      false,
      !!validatedOnly,
      environmentPostMapping[study.organizationVersion.environment],
      study.organizationVersion.environment,
      type,
    )

    // Compute results using real filtered values
    const filteredResult = computeResultsByPost(
      filteredStudy,
      tPost,
      studySite,
      true,
      !!validatedOnly,
      environmentPostMapping[study.organizationVersion.environment],
      study.organizationVersion.environment,
      type,
    )

    const filteredResultsByTag = computeResultsByTag(
      filteredStudy,
      studySite,
      true,
      !!validatedOnly,
      study.organizationVersion.environment,
      t,
    )

    const withDepForcedValue = filteredResultWithDep.find((r) => r.post === 'total')?.value || 0
    const withDepForced = convertValue(withDepForcedValue, StudyResultUnit.K, study.resultsUnit)

    const withoutDepForcedValue = filteredResultWithoutDep.find((r) => r.post === 'total')?.value || 0
    const withoutDepForced = convertValue(withoutDepForcedValue, StudyResultUnit.K, study.resultsUnit)

    const isUtilisationEnDependanceSelected = selectedSubposts.includes(SubPost.UtilisationEnDependance)
    const filteredResultsByPost = isUtilisationEnDependanceSelected ? filteredResult : filteredResultWithoutDep

    const total = filteredResultsByPost.find((r) => r.post === 'total')
    const monetaryRatio = calculateMonetaryRatio(total?.monetaryValue || 0, total?.value || 0)
    const nonSpecificMonetaryRatio = calculateMonetaryRatio(total?.nonSpecificMonetaryValue || 0, total?.value || 0)

    return {
      withDepForced,
      withoutDepForced,
      filteredResultsByPost,
      filteredResultsByTag,
      filteredEmissionSources,
      monetaryRatio,
      nonSpecificMonetaryRatio,
    }
  }, [study, studySite, selectedSubposts, selectedTags, validatedOnly, t, tPost, type])

  const computedBegesData = useMemo(
    () => computeBegesResult(study, begesRules, emissionFactorsWithParts, studySite, false, validatedOnly),
    [study, begesRules, emissionFactorsWithParts, studySite, validatedOnly],
  )

  const computedGHGPData = useMemo(
    () =>
      computeGHGPResult(study, ghgpRules, emissionFactorsWithParts, studySite, false, validatedOnly, selectedGHGPTable),
    [study, ghgpRules, emissionFactorsWithParts, studySite, validatedOnly, selectedGHGPTable],
  )

  const downloadReport = useCallback(async () => {
    callServerFunction(() => prepareReport(study, { monetaryRatio, nonSpecificMonetaryRatio }), {
      onSuccess: (data) => {
        download([data], `${study.name}_report.docx`, 'docx')
      },
    })
  }, [study, monetaryRatio, nonSpecificMonetaryRatio, callServerFunction])

  const hasAccessToEmissionSourcesDownload = useMemo(
    () => hasAccessToDownloadStudyEmissionSourcesButton(study.organizationVersion.environment),
    [study.organizationVersion.environment],
  )

  if (!environment) {
    return null
  }
  const downloadEmissionSources = async (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    preventClose(e)
    if (hasAccessToEmissionSourcesDownload) {
      await downloadStudyEmissionSources(
        study,
        tStudyExport,
        tCaracterisations,
        tPost,
        tQuality,
        tUnit,
        tResultUnits,
        tBase,
        environment,
      )
    }
  }

  const downloadResults = async (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    preventClose(e)
    await downloadStudyResults(
      study,
      begesRules,
      ghgpRules,
      emissionFactorsWithParts,
      t,
      tExport,
      tPost,
      tOrga,
      tQuality,
      tBeges,
      tGHGP,
      tUnits,
      environment,
      selectedGHGPTable,
    )
  }

  const preventClose = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const navigateToEmissionSource = (emissionSourceId: string, subPost: SubPost) => {
    const post = getPost(subPost)
    if (post) {
      const emissionSource = study.emissionSources.find((es) => es.id === emissionSourceId)
      const targetSite = emissionSource?.studySite.id
      const url = `/etudes/${study.id}/comptabilisation/saisie-des-donnees/${post}?site=${targetSite}#emission-source-${emissionSourceId}`
      router.push(url)
    }
  }

  return (
    <Block
      title={tStudyNav('results')}
      as="h2"
      rightComponent={
        <div className="flex gapped1 align-center">
          <Select
            id="download-results-dropdown"
            labelId="download-results-dropdown"
            value="download"
            renderValue={() => (
              <div className="align-center">
                <DownloadIcon className="mr-2" /> {t('download')}
              </div>
            )}
          >
            {study.emissionSources.length > 0 && (
              <MenuItem>
                <div className="grow justify-start" onClick={downloadEmissionSources}>
                  {tStudyExport('download')}
                </div>
              </MenuItem>
            )}
            <MenuItem>
              <div className="grow justify-start" onClick={downloadResults}>
                {t('downloadResults')}
              </div>
            </MenuItem>
          </Select>
          {isDownloadReportActive && (
            <Button onClick={downloadReport} title={t('downloadReport')} variant="outlined">
              <SummarizeIcon className="mr-2" /> {t('resultsWord')}
            </Button>
          )}
          <SelectStudySite sites={study.sites} defaultValue={studySite} setSite={setSite} />
        </div>
      }
    >
      <div className="flex-col gapped2">
        <div className="flex gapped2">
          <FormControl>
            <InputLabel id="result-type-selector-label">{t('format')}</InputLabel>
            <Select
              value={type}
              label={t('format')}
              aria-labelledby="result-type-selector-label"
              onChange={(event) => {
                setType(event.target.value as ResultType)
              }}
              data-testid="result-type-select"
              disabled={!allowTypeSelect}
            >
              <MenuItem value={AdditionalResultTypes.CONSOLIDATED}>{tExport('consolidated')}</MenuItem>
              {environment && hasAccessToBcExport(environment) && (
                <MenuItem value={AdditionalResultTypes.ENV_SPECIFIC_EXPORT}>{tExport('env_specific_export')}</MenuItem>
              )}
              {exports &&
                exports?.types.map((exportItem) => (
                  <MenuItem key={exportItem} value={exportItem} disabled={exports.control === ControlMode.CapitalShare}>
                    {tExport(exportItem)}
                    {exports.control === ControlMode.CapitalShare && <em> ({t('coming')})</em>}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          {type === Export.Beges && (
            <ConsolatedBEGESDifference
              study={study}
              emissionFactorsWithParts={emissionFactorsWithParts}
              validatedOnly={validatedOnly}
              consolidatedResults={filteredResultsByPost}
              begesResults={computedBegesData}
              studySite={studySite}
              navigateToEmissionSource={navigateToEmissionSource}
            />
          )}
          {type === Export.GHGP && (
            <>
              <ConsolatedGHGPDifference
                study={study}
                emissionFactorsWithParts={emissionFactorsWithParts}
                validatedOnly={validatedOnly}
                consolidatedResults={filteredResultsByPost}
                ghgpResults={computedGHGPData}
                studySite={studySite}
                ghgpRules={ghgpRules}
                navigateToEmissionSource={navigateToEmissionSource}
                base={selectedGHGPTable}
              />
              <ElectricityBaseDifference
                emissionSources={study.emissionSources.filter(
                  (emissionSource) => emissionSource.subPost === SubPost.Electricite,
                )}
                exports={study.exports?.types}
                className="align-center"
              />
            </>
          )}
        </div>
        {type !== Export.Beges &&
          (type === AdditionalResultTypes.CONSOLIDATED || type === AdditionalResultTypes.ENV_SPECIFIC_EXPORT) &&
          (environment === Environment.BC || environment === Environment.TILT) && (
            <ResultFilters
              study={study}
              selectedPostIds={selectedSubposts}
              selectedTagIds={selectedTags}
              onPostFilterChange={setSelectedSubposts}
              onTagFilterChange={setSelectedTags}
              exportType={type}
            />
          )}
        <div className="mt1">
          {type === AdditionalResultTypes.CONSOLIDATED && (
            <>
              <EmissionsAnalysis
                study={study}
                studySite={studySite}
                withDepValue={withDepForced}
                withoutDepValue={withoutDepForced}
                monetaryRatio={monetaryRatio}
                nonSpecificMonetaryRatio={nonSpecificMonetaryRatio}
                caUnit={caUnit}
                computedResultsByTag={filteredResultsByTag}
              />
              <ConsolidatedResults computedResults={filteredResultsByPost} resultsUnit={study.resultsUnit} />
            </>
          )}
          {type === Export.Beges && (
            <BegesResultsTable study={study} withDepValue={withDepValue} data={computedBegesData} />
          )}
          {type === Export.GHGP && (
            <Box>
              <div className="flex-row justify-between align-center mb1">
                <Tabs value={selectedGHGPTable} onChange={(_e, v) => setSelectedGHGPTable(v)}>
                  {Object.values(EmissionFactorBase).map((tab) => (
                    <Tab key={tab} value={tab} label={tBase(tab)} data-testid={`$ghg-${tab}-tab`} />
                  ))}
                </Tabs>
              </div>
              <GHGPResultsTable study={study} withDepValue={withDepValue} data={computedGHGPData} />
            </Box>
          )}
        </div>
        {type === AdditionalResultTypes.CONSOLIDATED && (
          <UncertaintyAnalytics
            filteredResults={filteredResultsByPost}
            studyId={study.id}
            resultsUnit={study.resultsUnit}
            emissionSources={filteredEmissionSources}
            environment={environment}
            validatedOnly={validatedOnly}
            selectedPostIds={selectedSubposts}
          />
        )}
      </div>
    </Block>
  )
}

export default AllResults
