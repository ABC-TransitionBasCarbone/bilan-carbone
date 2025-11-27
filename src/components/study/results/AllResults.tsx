'use client'

import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { download } from '@/services/file'
import { hasAccessToBcExport, hasAccessToDownloadStudyEmissionSourcesButton } from '@/services/permissions/environment'
import { computeBegesResult } from '@/services/results/beges'
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
import DownloadIcon from '@mui/icons-material/Download'
import SummarizeIcon from '@mui/icons-material/Summarize'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { ControlMode, DeactivatableFeature, Environment, Export, ExportRule, SiteCAUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'
import SelectStudySite from '../site/SelectStudySite'
import useStudySite from '../site/useStudySite'
import BegesResultsTable from './beges/BegesResultsTable'
import ConsolatedBEGESDifference from './ConsolatedBEGESDifference'
import ConsolidatedResults from './consolidated/ConsolidatedResults'
import EmissionsAnalysis from './consolidated/EmissionsAnalysis'
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
  const tUnits = useTranslations('study.results.units')
  const tResultUnits = useTranslations('study.results.units')
  const tStudyExport = useTranslations('study.export')
  const tCaracterisations = useTranslations('categorisations')
  const tStudyNav = useTranslations('study.navigation')
  const { environment } = useAppEnvironmentStore()
  const [type, setType] = useState<ResultType>(AdditionalResultTypes.CONSOLIDATED)
  const exports = useMemo(() => study.exports, [study.exports])
  const [displayValueWithDep, setDisplayValueWithDep] = useState(true)
  const [isDownloadReportActive, setIsDownloadReportActive] = useState(false)

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

  const allowTypeSelect = useMemo(() => {
    if (exports.length > 0) {
      return true
    }
    if (environment && hasAccessToBcExport(environment)) {
      return true
    }
    return false
  }, [environment, exports])

  const {
    withDepValue,
    withoutDepValue,
    monetaryRatio,
    nonSpecificMonetaryRatio,
    computedResultsByTag,
    computedResultsWithDep,
    computedResultsWithoutDep,
  } = useMemo(
    () =>
      getDetailedEmissionResults(
        study,
        tPost,
        studySite,
        !!validatedOnly,
        study.organizationVersion.environment,
        t,
        displayValueWithDep,
        type,
      ),
    [displayValueWithDep, study, studySite, t, tPost, type, validatedOnly],
  )

  const computedBegesData = useMemo(
    () => computeBegesResult(study, begesRules, emissionFactorsWithParts, studySite, false, validatedOnly),
    [study, begesRules, emissionFactorsWithParts, studySite, validatedOnly],
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
        environment,
      )
    }
  }

  const downloadResults = async (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    preventClose(e)
    await downloadStudyResults(
      study,
      begesRules,
      emissionFactorsWithParts,
      t,
      tExport,
      tPost,
      tOrga,
      tQuality,
      tBeges,
      tUnits,
      environment,
    )
  }

  const preventClose = (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    e.preventDefault()
    e.stopPropagation()
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
          {exports.map((exportType) => exportType.type).includes(Export.Beges) && (
            <ConsolatedBEGESDifference
              study={study}
              emissionFactorsWithParts={emissionFactorsWithParts}
              validatedOnly={validatedOnly}
              results={computedResultsWithDep}
              begesResults={computedBegesData}
              studySite={studySite}
            />
          )}
          <FormControl>
            <InputLabel id="result-type-selector-label">{t('type')}</InputLabel>
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
              {exports.map((exportItem) => (
                <MenuItem
                  key={exportItem.type}
                  value={exportItem.type}
                  disabled={exportItem.type !== Export.Beges || exportItem.control === ControlMode.CapitalShare}
                >
                  {tExport(exportItem.type)}
                  {(exportItem.type !== Export.Beges || exportItem.control === ControlMode.CapitalShare) && (
                    <em> ({t('coming')})</em>
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="mt1">
          {type !== Export.Beges && (
            <>
              <EmissionsAnalysis
                study={study}
                studySite={studySite}
                withDepValue={withDepValue}
                withoutDepValue={withoutDepValue}
                displayValueWithDep={displayValueWithDep}
                setDisplayValueWithDep={setDisplayValueWithDep}
                monetaryRatio={monetaryRatio}
                nonSpecificMonetaryRatio={nonSpecificMonetaryRatio}
                caUnit={caUnit}
                computedResultsByTag={computedResultsByTag}
              />
              <ConsolidatedResults
                computedResults={displayValueWithDep ? computedResultsWithDep : computedResultsWithoutDep}
                resultsUnit={study.resultsUnit}
                exportType={type}
              />
            </>
          )}
          {type === Export.Beges && (
            <BegesResultsTable study={study} withDepValue={withDepValue} data={computedBegesData} />
          )}
        </div>
        {type !== Export.Beges && (
          <UncertaintyAnalytics
            computedResults={displayValueWithDep ? computedResultsWithDep : computedResultsWithoutDep}
            studyId={study.id}
            resultsUnit={study.resultsUnit}
            emissionSources={study.emissionSources}
            environment={environment}
            validatedOnly={validatedOnly}
          />
        )}
      </div>
    </Block>
  )
}

export default AllResults
