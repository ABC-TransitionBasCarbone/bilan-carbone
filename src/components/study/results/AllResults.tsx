'use client'
import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { hasAccessToBcExport } from '@/services/permissions/environment'
import { computeBegesResult } from '@/services/results/beges'
import { AdditionalResultTypes, downloadStudyResults, getResultsValues, ResultType } from '@/services/study'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import DownloadIcon from '@mui/icons-material/Download'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { ControlMode, Environment, Export, ExportRule, SiteCAUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
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
  const tOrga = useTranslations('study.organization')
  const tPost = useTranslations('emissionFactors.post')
  const tExport = useTranslations('exports')
  const tQuality = useTranslations('quality')
  const tBeges = useTranslations('beges')
  const tUnits = useTranslations('study.results.units')
  const tStudyNav = useTranslations('study.navigation')

  const { environment } = useAppEnvironmentStore()
  const [type, setType] = useState<ResultType>(AdditionalResultTypes.CONSOLIDATED)
  const exports = useMemo(() => study.exports, [study.exports])
  const [displayValueWithDep, setDisplayValueWithDep] = useState(true)

  useEffect(() => {
    if (environment && environment !== Environment.BC) {
      setType(AdditionalResultTypes.ENV_SPECIFIC_EXPORT)
    }
  }, [environment])

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
      getResultsValues(
        study,
        tPost,
        studySite,
        !!validatedOnly,
        study.organizationVersion.environment,
        t,
        displayValueWithDep,
      ),
    [displayValueWithDep, study, studySite, t, tPost, validatedOnly],
  )

  const computedBegesData = useMemo(
    () => computeBegesResult(study, rules, emissionFactorsWithParts, studySite, false, validatedOnly),
    [study, rules, emissionFactorsWithParts, studySite, validatedOnly],
  )

  if (!environment) {
    return null
  }

  return (
    <Block title={tStudyNav('results')} as="h1">
      <div className="flex gapped1 mb2">
        <SelectStudySite study={study} allowAll studySite={studySite} setSite={setSite} />
        <FormControl>
          <InputLabel id="result-type-selector-label">{t('type')}</InputLabel>
          <Select
            value={type}
            label={t('type')}
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
        <Button
          onClick={() =>
            downloadStudyResults(
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
          title={t('download')}
        >
          <DownloadIcon />
        </Button>
        {exports.map((exportType) => exportType.type).includes(Export.Beges) && (
          <ConsolatedBEGESDifference
            study={study}
            rules={rules}
            emissionFactorsWithParts={emissionFactorsWithParts}
            studySite={studySite}
            validatedOnly={validatedOnly}
          />
        )}
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
          study={study}
        />
      )}
    </Block>
  )
}

export default AllResults
