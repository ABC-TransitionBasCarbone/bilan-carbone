import { Post, subPostsByPost } from '@/services/posts'
import { BCUnit, useUnitLabel } from '@/services/unit'
import { FeFilters } from '@/types/filters'
import {
  Autocomplete,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  ListItemText,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material'
import { EmissionFactorImportVersion, SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react'
import Button from '../base/Button'
import DebouncedInput from '../base/DebouncedInput'
import MultiSelectAll from '../base/MultiSelectAll'
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
  const tPosts = useTranslations('emissionFactors.post')
  const [displayFilters, setDisplayFilters] = useState(true)
  const [displayHideButton, setDisplayHideButton] = useState(false)
  const getUnitLabel = useUnitLabel()

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

  const allUnitsSelected = useMemo(
    () => filters.units.filter((unit) => unit !== 'all').length === initialSelectedUnits.length - 1,
    [filters.units, initialSelectedUnits.length],
  )

  const unitsSelectorRenderValue = () =>
    allUnitsSelected
      ? t('all')
      : filters.units.length === 0
        ? t('none')
        : filters.units.map((unit) => getUnitLabel(unit)).join(', ')

  const allSelectedSubPosts = useMemo(
    () => filters.subPosts.length === envSubPosts.length,
    [filters.subPosts, envSubPosts],
  )

  const subPostsSelectorRenderValue = () =>
    allSelectedSubPosts
      ? tPosts('all')
      : filters.subPosts.length === 0
        ? tPosts('none')
        : filters.subPosts.map((subPosts) => tPosts(subPosts)).join(', ')

  const areAllSelected = (post: Post) => !subPostsByPost[post].some((subPost) => !filters.subPosts.includes(subPost))

  const selectAllSubPosts = () =>
    setFilters((prevFilters) => ({ ...prevFilters, subPosts: allSelectedSubPosts ? [] : envSubPosts }))

  const selectPost = (post: Post) => {
    const newValue = areAllSelected(post)
      ? filters.subPosts.filter(
          (filteredSubPost) => filteredSubPost === 'all' || !subPostsByPost[post].includes(filteredSubPost),
        )
      : filters.subPosts.concat(subPostsByPost[post].filter((a) => !filters.subPosts.includes(a)))
    setFilters((prevFilters) => ({ ...prevFilters, subPosts: newValue }))
  }

  const selectSubPost = (subPost: SubPost) => {
    const newValue = filters.subPosts.includes(subPost)
      ? filters.subPosts.filter((filteredSubPost) => filteredSubPost !== subPost)
      : filters.subPosts.concat([subPost])
    setFilters((prevFilters) => ({ ...prevFilters, subPosts: newValue }))
  }

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
          <FormControl>
            <FormLabel id="emission-factors-filter-location" component="legend">
              {t('locationSearch')}
            </FormLabel>
            <Autocomplete
              value={filters.location}
              options={locationOptions}
              onChange={(_, option) => setFilters((prevFilters) => ({ ...prevFilters, location: option || '' }))}
              onInputChange={(_, newInputValue) =>
                setFilters((prevFilters) => ({ ...prevFilters, location: newInputValue }))
              }
              renderInput={(params) => (
                <TextField {...params} placeholder={t('locationSearchPlaceholder')} className={styles.locationInput} />
              )}
            />
          </FormControl>
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
          <FormControl className={styles.selector}>
            <FormLabel id="emissions-unit-selector" component="legend">
              {t('units')}
            </FormLabel>
            <MultiSelectAll
              id="emissions-unit"
              renderValue={unitsSelectorRenderValue}
              value={filters.units}
              allValues={initialSelectedUnits.filter((unit) => unit != 'all')}
              setValues={(values) => setFilters((prevFilters) => ({ ...prevFilters, units: values }))}
            />
          </FormControl>
          <FormControl className={styles.selector}>
            <FormLabel id="emissions-subposts-selector" component="legend">
              {t('subPosts')}
            </FormLabel>
            <Select
              id="emissions-subposts-selector"
              labelId="emissions-subposts-selector"
              value={filters.subPosts}
              renderValue={subPostsSelectorRenderValue}
              multiple
            >
              <MenuItem key="subpost-item-all" selected={allSelectedSubPosts} onClick={selectAllSubPosts}>
                <Checkbox checked={allSelectedSubPosts} />
                <ListItemText primary={tPosts(allSelectedSubPosts ? 'unselectAll' : 'selectAll')} />
              </MenuItem>
              {Object.values(envPosts).map((post) => (
                <div key={`subpostGroup-${post}`}>
                  <MenuItem key={`subpost-${post}`} selected={areAllSelected(post)} onClick={() => selectPost(post)}>
                    <Checkbox checked={areAllSelected(post)} />
                    <ListItemText primary={tPosts(post)} />
                  </MenuItem>
                  {subPostsByPost[post].map((subPost) => (
                    <MenuItem
                      key={`subpost-${subPost}`}
                      className={styles.subPostItem}
                      selected={filters.subPosts.includes(subPost)}
                      onClick={() => selectSubPost(subPost)}
                    >
                      <Checkbox checked={filters.subPosts.includes(subPost)} />
                      <ListItemText primary={tPosts(subPost)} />
                    </MenuItem>
                  ))}
                </div>
              ))}
            </Select>
          </FormControl>
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
