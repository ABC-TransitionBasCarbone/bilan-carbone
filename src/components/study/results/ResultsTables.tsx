'use client'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { Export, ExportRule } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import SelectStudySite from '../site/SelectStudySite'
import useStudySite from '../site/useStudySite'
import BegesResultsTable from './beges/BegesResultsTable'
import ConsolidatedResultsTable from './consolidated/ConsolidatedResultsTable'
import DependanciesSwitch from './DependanciesSwitch'
import styles from './ResultsTables.module.css'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
}

const ResultsTables = ({ study, rules, emissionFactorsWithParts }: Props) => {
  const t = useTranslations('study.results')
  const tExport = useTranslations('exports')

  const [withDependencies, setWithDependancies] = useState(true)
  const [type, setType] = useState<Export | 'consolidated'>('consolidated')
  const exports = useMemo(() => study.exports.map((e) => e.type), [study.exports])
  const { site, setSite } = useStudySite(study, true)

  return (
    <>
      <div className={classNames(styles.select, 'flex')}>
        <SelectStudySite study={study} allowAll site={site} setSite={setSite} />
        <FormControl>
          <InputLabel id="result-type-selector-label">{t('type')}</InputLabel>
          <Select
            value={type}
            label={t('type')}
            aria-labelledby="result-type-selector-label"
            onChange={(event) => {
              setType(event.target.value as Export | 'consolidated')
            }}
            disabled={exports.length === 0}
          >
            <MenuItem value="consolidated">{tExport('consolidated')}</MenuItem>
            {exports.map((type) => (
              <MenuItem key={type} value={type} disabled={type !== Export.Beges}>
                {tExport(type)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <DependanciesSwitch withDependencies={withDependencies} setWithDependancies={setWithDependancies} />
      </div>
      <div className="mt1">
        {type === 'consolidated' && (
          <ConsolidatedResultsTable study={study} site={site} withDependencies={withDependencies} />
        )}
        {type === Export.Beges && (
          <BegesResultsTable
            study={study}
            rules={rules.filter((rule) => rule.export === Export.Beges)}
            emissionFactorsWithParts={emissionFactorsWithParts}
            site={site}
            withDependencies={withDependencies}
          />
        )}
      </div>
    </>
  )
}

export default ResultsTables
