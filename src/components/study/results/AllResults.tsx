'use client'
import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { hasAccessToBcExport } from '@/services/permissions/environment'
import { AdditionalResultTypes, downloadStudyResults, ResultType } from '@/services/study'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import DownloadIcon from '@mui/icons-material/Download'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { ControlMode, Export, ExportRule } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import SelectStudySite from '../site/SelectStudySite'
import useStudySite from '../site/useStudySite'
import BegesResultsTable from './beges/BegesResultsTable'
import ConsolatedBEGESDifference from './ConsolatedBEGESDifference'
import ConsolidatedResults from './consolidated/ConsolidatedResults'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
}

const AllResults = ({ study, rules, emissionFactorsWithParts, validatedOnly }: Props) => {
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

  useEffect(() => {
    if (environment && hasAccessToBcExport(environment)) {
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
        {type === AdditionalResultTypes.CONSOLIDATED && (
          <ConsolidatedResults study={study} studySite={studySite} withDependencies validatedOnly={validatedOnly} />
        )}
        {type === AdditionalResultTypes.ENV_SPECIFIC_EXPORT && (
          <ConsolidatedResults
            study={study}
            studySite={studySite}
            withDependencies
            validatedOnly={validatedOnly}
            type={type}
          />
        )}
        {type === Export.Beges && (
          <BegesResultsTable
            study={study}
            rules={begesRules}
            emissionFactorsWithParts={emissionFactorsWithParts}
            studySite={studySite}
            withDependencies={false}
          />
        )}
      </div>
    </Block>
  )
}

export default AllResults
