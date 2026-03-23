import { Post } from '@/services/posts'
import { BCUnit, useUnitLabel } from '@/services/unit'
import { FeFilters } from '@/types/filters'
import {
  Autocomplete,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  ListItemText,
  MenuItem,
  Popper,
  Select,
  Switch,
  TextField,
} from '@mui/material'
import { EmissionFactorBase, SubPost } from '@repo/db-common/enums'
import type { EmissionFactorImportVersion } from '@repo/db-common'
import { Button } from '@repo/ui'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import DebouncedInput from '../base/DebouncedInput'
import MultiSelectAll from '../base/MultiSelectAll'
import { PostSubPostFilter } from '../form/PostSubPostFilter'
import styles from './EmissionFactorsTable.module.css'

export type ImportVersionForFilters = Pick<EmissionFactorImportVersion, 'id' | 'source' | 'name'>
interface Props {
  fromModal: boolean
  importVersions: ImportVersionForFilters[]
  initialSelectedUnits: (BCUnit | string)[]
  envPosts: Post[]
  envSubPosts: SubPost[]
  filters: FeFilters
  locationOptions: string[]
  setFilters: Dispatch<SetStateAction<FeFilters>>
}
export const EmissionFactorsFilters = ({
  fromModal,
  importVersions,
  initialSelectedUnits,
  envPosts,
  envSubPosts,
  filters,
  locationOptions,
  setFilters,
}: Props) => {
  const t = useTranslations('emissionFactors.table')
  const tUnit = useUnitLabel()
  const tBase = useTranslations('emissionFactors.base')
  const [displayFilters, setDisplayFilters] = useState(true)
  const [displayHideButton, setDisplayHideButton] = useState(false)

  const [unitsInputValue, setUnitsInputValue] = useState('')
  const [locationsInputValue, setLocationsInputValue] = useState('')
  const filtersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkWrappedRows = () => {
      if (filtersRef.current) {
        let hideButton = true
        for (let i = 1; i < filtersRef.current.children.length - 1; i++) {
          const element = filtersRef.current.children[i] as HTMLElement
          const prevElement = filtersRef.current.children[i - 1] as HTMLElement
          if (element.offsetLeft <= prevElement.offsetLeft) {
            hideButton = false
          }
        }
        setDisplayHideButton(hideButton)
      }
    }

    checkWrappedRows()
    window.addEventListener('resize', checkWrappedRows)
    return () => window.removeEventListener('resize', checkWrappedRows)
  }, [])

  const getEmissionVersionLabel = (version?: Pick<EmissionFactorImportVersion, 'source' | 'name'>) =>
    version ? `${t(version.source)} ${version.name}` : ''

  const statusSelectorRenderValue = () =>
    filters.sources.length === importVersions.length
      ? t('all')
      : filters.sources
          .map((source) => getEmissionVersionLabel(importVersions.find((importVersion) => importVersion.id === source)))
          .join(', ')

  return (
    <div ref={filtersRef} className={classNames(styles.filters, 'align-center wrap mt-2 mb1')}>
      {displayFilters && (
        <>
          <FormControl>
            <FormLabel id="emission-factors-filter-search" component="legend">
              {t('search')}
            </FormLabel>
            <DebouncedInput
              className={styles.searchInput}
              debounce={500}
              value={filters.search}
              onChange={(newValue) => setFilters((prevFilters) => ({ ...prevFilters, search: newValue }))}
              placeholder={t('searchPlaceholder')}
              data-testid="emission-factor-search-input"
            />
          </FormControl>
          <FormControl className={styles.multiSelector}>
            <FormLabel id="emission-factors-filter-location" component="legend">
              {t('locationSearch')}
            </FormLabel>

            <Autocomplete
              multiple
              disableCloseOnSelect
              value={filters.locations}
              options={locationOptions}
              inputValue={locationsInputValue}
              clearOnBlur={false}
              onInputChange={(_, newValue, reason) => {
                if (reason === 'input') {
                  setLocationsInputValue(newValue)
                }
              }}
              getOptionKey={(location) => location}
              filterSelectedOptions={false}
              onChange={(_, newValue) => {
                setFilters((prev) => ({
                  ...prev,
                  locations: newValue,
                }))
                setLocationsInputValue('')
              }}
              renderOption={(props, option) => {
                const { key, ...restProps } = props
                return (
                  <MenuItem key={option} {...restProps}>
                    <ListItemText primary={option} />
                  </MenuItem>
                )
              }}
              renderInput={(params) => <TextField {...params} placeholder={t('locationSearchPlaceholder')} />}
              slots={{ popper: Popper }}
              slotProps={{ popper: { style: { minWidth: 300 } } }}
              renderValue={(selected, getItemProps) => {
                const visible = selected.slice(0, 3)
                const hiddenCount = selected.length - visible.length
                return (
                  <>
                    {visible.map((option, index) => (
                      <Chip label={option} {...getItemProps({ index })} key={option} />
                    ))}

                    {hiddenCount > 0 && <Chip label={`+${hiddenCount}`} size="small" sx={{ pointerEvents: 'none' }} />}
                  </>
                )
              }}
            />
          </FormControl>
          <FormControl className={styles.multiSelector}>
            <FormLabel id="emissions-unit-selector" component="legend">
              {t('unitSearch')}
            </FormLabel>

            <Autocomplete
              multiple
              disableCloseOnSelect
              value={filters.units}
              options={initialSelectedUnits}
              inputValue={unitsInputValue}
              clearOnBlur={false}
              onInputChange={(_, newValue, reason) => {
                if (reason === 'input') {
                  setUnitsInputValue(newValue)
                }
              }}
              getOptionLabel={(unit) => tUnit(unit)}
              getOptionKey={(unit) => unit}
              filterSelectedOptions={false}
              onChange={(_, newValue) => {
                setFilters((prev) => ({
                  ...prev,
                  units: newValue,
                }))
                setUnitsInputValue('')
              }}
              renderOption={(props, option) => {
                const { key, ...restProps } = props
                return (
                  <MenuItem key={option} {...restProps}>
                    <ListItemText primary={tUnit(option)} />
                  </MenuItem>
                )
              }}
              renderInput={(params) => <TextField {...params} placeholder={t('unitSearchPlaceholder')} />}
              slots={{ popper: Popper }}
              slotProps={{ popper: { style: { minWidth: 300 } } }}
              renderValue={(selected, getItemProps) => {
                const visible = selected.slice(0, 3)
                const hiddenCount = selected.length - visible.length

                return (
                  <>
                    {visible.map((option, index) => (
                      <Chip label={tUnit(option)} {...getItemProps({ index })} key={option} />
                    ))}

                    {hiddenCount > 0 && <Chip label={`+${hiddenCount}`} size="small" sx={{ pointerEvents: 'none' }} />}
                  </>
                )
              }}
            />
          </FormControl>
          {filters.base && (
            <FormControl className={styles.selector}>
              <FormLabel id="emissions-unit-selector" component="legend">
                {t('base')}
              </FormLabel>
              <MultiSelectAll
                id="emissions-base"
                values={filters.base}
                allValues={Object.values(EmissionFactorBase)}
                setValues={(values) => setFilters((prevFilters) => ({ ...prevFilters, base: values }))}
                getLabel={(base) => tBase(base)}
              />
            </FormControl>
          )}
          <FormControl className={styles.selector}>
            <FormLabel id="emissions-sources-selector" component="legend">
              {t('sources')}
            </FormLabel>
            <Select
              id="emissions-sources-selector"
              labelId="emissions-sources-selector"
              value={filters.sources}
              onChange={({ target: { value } }) =>
                setFilters((prevFilters) => ({ ...prevFilters, sources: value as string[] }))
              }
              renderValue={statusSelectorRenderValue}
              multiple
            >
              {importVersions.map((importVersion) => (
                <MenuItem key={`source-item-${importVersion.id}`} value={importVersion.id}>
                  <Checkbox checked={filters.sources.includes(importVersion.id)} />
                  <ListItemText primary={getEmissionVersionLabel(importVersion)} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <PostSubPostFilter
            envPosts={envPosts}
            envSubPosts={envSubPosts}
            selectedSubPosts={filters.subPosts.filter((sp) => sp !== 'all')}
            onChange={(subPosts) => setFilters((prevFilters) => ({ ...prevFilters, subPosts }))}
            showSeparateLabel={true}
            className={styles.selector}
          />
          <FormControl className={styles.selector}>
            <FormLabel id="archived-emissions-factors-radio-group-label" component="legend">
              {t('displayArchived')}
            </FormLabel>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.archived}
                  data-testid="archived-emissions-factors-switch"
                  onChange={(event) =>
                    setFilters((prevFilters) => ({ ...prevFilters, archived: event.target.checked }))
                  }
                />
              }
              label={t(filters.archived ? 'yes' : 'no')}
            />
          </FormControl>
        </>
      )}
      {fromModal && (
        <div className={classNames({ [styles.hideFiltersButton]: displayHideButton })}>
          <Button onClick={() => setDisplayFilters(!displayFilters)}>
            {t(displayFilters ? 'hideFilters' : 'displayFilters')}
          </Button>
        </div>
      )}
    </div>
  )
}
