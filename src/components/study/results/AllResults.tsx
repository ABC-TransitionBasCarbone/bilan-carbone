'use client'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { downloadStudyResults } from '@/services/study'
import DownloadIcon from '@mui/icons-material/Download'
import { Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { ControlMode, Export, ExportRule } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import SelectStudySite from '../site/SelectStudySite'
import useStudySite from '../site/useStudySite'
import BegesResultsTable from './beges/BegesResultsTable'
import ConsolidatedResults from './consolidated/ConsolidatedResults'
import DependenciesSwitch from './DependenciesSwitch'
import styles from './ResultsTables.module.css'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
}

const AllResults = ({ study, rules, emissionFactorsWithParts }: Props) => {
  const t = useTranslations('study.results')
  const tOrga = useTranslations('study.organization')
  const tPost = useTranslations('emissionFactors.post')
  const tExport = useTranslations('exports')
  const tQuality = useTranslations('quality')
  const tBeges = useTranslations('beges')
  const tUnits = useTranslations('study.results.units')

  const [withDependencies, setWithDependencies] = useState(true)
  const [type, setType] = useState<Export | 'consolidated'>('consolidated')
  const exports = useMemo(() => study.exports, [study.exports])
  const { studySite, setSite } = useStudySite(study, true)

  const begesRules = useMemo(() => rules.filter((rule) => rule.export === Export.Beges), [rules])

  return (
    <>
      <div className={classNames(styles.select, 'flex')}>
        <SelectStudySite study={study} allowAll studySite={studySite} setSite={setSite} />
        <FormControl>
          <InputLabel id="result-type-selector-label">{t('type')}</InputLabel>
          <Select
            value={type}
            label={t('type')}
            aria-labelledby="result-type-selector-label"
            onChange={(event) => {
              setType(event.target.value as Export | 'consolidated')
            }}
            data-testid="result-type-select"
            disabled={exports.length === 0}
          >
            <MenuItem value="consolidated">{tExport('consolidated')}</MenuItem>
            {exports.map((exportItem) => (
              <MenuItem
                key={exportItem.type}
                value={exportItem.type}
                disabled={exportItem.type !== Export.Beges || exportItem.control !== ControlMode.Operational}
              >
                {tExport(exportItem.type)}
                {(exportItem.type !== Export.Beges || exportItem.control !== ControlMode.Operational) && (
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
            )
          }
        >
          <DownloadIcon />
        </Button>
        {type !== 'consolidated' && (
          <DependenciesSwitch withDependencies={withDependencies} setWithDependencies={setWithDependencies} />
        )}
      </div>
      <div className="mt1">
        {type === 'consolidated' && (
          <ConsolidatedResults study={study} studySite={studySite} withDependencies={withDependencies} />
        )}
        {type === Export.Beges && (
          <BegesResultsTable
            study={study}
            rules={rules.filter((rule) => rule.export === Export.Beges)}
            emissionFactorsWithParts={emissionFactorsWithParts}
            studySite={studySite}
            withDependencies={withDependencies}
          />
        )}
      </div>
    </>
  )
}

export default AllResults
