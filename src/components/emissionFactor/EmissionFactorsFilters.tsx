import { Post, subPostsByPost } from '@/services/posts'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { BCUnit } from '@/services/unit'
import {
  Autocomplete,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
} from '@mui/material'
import { EmissionFactorImportVersion, SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../base/Button'
import DebouncedInput from '../base/DebouncedInput'
import MultiSelectAll from '../base/MultiSelectAll'
import styles from './Table.module.css'

const initialSelectedUnits: (BCUnit | string)[] = [...['all'], ...Object.values(BCUnit)]

interface Props {
  emissionFactors: EmissionFactorWithMetaData[]
  fromModal: boolean
  importVersions: EmissionFactorImportVersion[]
  initialSelectedSources: string[]
  initialSelectedSubPosts: SubPost[]
  envPosts: Post[]
}
export const EmissionFactorsFilters = ({
  emissionFactors,
  fromModal,
  importVersions,
  initialSelectedSources,
  initialSelectedSubPosts,
  envPosts,
}: Props) => {
  const t = useTranslations('emissionFactors.table')
  const tUnits = useTranslations('units')
  const tPosts = useTranslations('emissionFactors.post')
  const [filter, setFilter] = useState('')
  const [displayArchived, setDisplayArchived] = useState(false)
  const [locationFilter, setLocationFilter] = useState('')
  const [displayFilters, setDisplayFilters] = useState(true)
  const [displayHideButton, setDisplayHideButton] = useState(false)
  const [filteredSources, setFilteredSources] = useState(initialSelectedSources)
  const [filteredUnits, setFilteredUnits] = useState(initialSelectedUnits)
  const [filteredSubPosts, setFilteredSubPosts] = useState(initialSelectedSubPosts)

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

  const getEmissionVersionLabel = (version?: EmissionFactorImportVersion) =>
    version ? `${t(version.source)} ${version.name}` : ''

  const envSubPosts = useMemo(() => {
    return envPosts.reduce((acc, post) => {
      const subPosts = subPostsByPost[post] || []
      return acc.concat(subPosts)
    }, [] as SubPost[])
  }, [envPosts])

  const getLocationLabel = useMemo(
    () => (row: EmissionFactorWithMetaData) =>
      `${row.location || t('noLocation')}${row.metaData?.location ? ` - ${row.metaData.location}` : ''}`,
    [t],
  )

  const selectSource = (event: SelectChangeEvent<typeof filteredSources>) => {
    const {
      target: { value },
    } = event
    setFilteredSources(value as string[])
  }

  const sortedImportVersions = useMemo(
    () =>
      importVersions.sort((a, b) => {
        if (initialSelectedSources.includes(a.id) === initialSelectedSources.includes(b.id)) {
          // both are sort selected or not selected : sort by alphabetical order
          return `${a.source} ${a.name}`.localeCompare(`${b.source} ${b.name}`)
        } else {
          // else : sort initially selected first
          return initialSelectedSources.includes(a.id) ? -1 : 1
        }
      }),
    [importVersions, initialSelectedSources],
  )

  const statusSelectorRenderValue = () =>
    filteredSources.length === importVersions.length
      ? t('all')
      : filteredSources
          .map((source) => getEmissionVersionLabel(importVersions.find((importVersion) => importVersion.id === source)))
          .join(', ')
  const allUnitsSelected = useMemo(
    () => filteredUnits.filter((unit) => unit !== 'all').length === initialSelectedUnits.length - 1,
    [filteredUnits],
  )

  const unitsSelectorRenderValue = () =>
    allUnitsSelected
      ? t('all')
      : filteredUnits.length === 0
        ? t('none')
        : filteredUnits.map((unit) => tUnits(unit)).join(', ')

  const allSelectedSubPosts = useMemo(
    () => filteredSubPosts.length === envSubPosts.length,
    [filteredSubPosts, envSubPosts],
  )

  const subPostsSelectorRenderValue = () =>
    allSelectedSubPosts
      ? tPosts('all')
      : filteredSubPosts.length === 0
        ? tPosts('none')
        : filteredSubPosts.map((subPosts) => tPosts(subPosts)).join(', ')

  const areAllSelected = (post: Post) => !subPostsByPost[post].some((subPost) => !filteredSubPosts.includes(subPost))

  const selectAllSubPosts = () => setFilteredSubPosts(allSelectedSubPosts ? [] : envSubPosts)

  const selectPost = (post: Post) => {
    const newValue = areAllSelected(post)
      ? filteredSubPosts.filter((filteredSubPost) => !subPostsByPost[post].includes(filteredSubPost))
      : filteredSubPosts.concat(subPostsByPost[post].filter((a) => !filteredSubPosts.includes(a)))
    setFilteredSubPosts(newValue)
  }

  const selectSubPost = (subPost: SubPost) => {
    const newValue = filteredSubPosts.includes(subPost)
      ? filteredSubPosts.filter((filteredSubPost) => filteredSubPost !== subPost)
      : filteredSubPosts.concat([subPost])
    setFilteredSubPosts(newValue)
  }

  const locationOptions = useMemo(
    () =>
      emissionFactors
        .map((emissionFactor) => getLocationLabel(emissionFactor))
        .filter(
          (location, i) =>
            emissionFactors.map((emissionFactor) => getLocationLabel(emissionFactor)).indexOf(location) === i,
        ),
    [emissionFactors, getLocationLabel],
  )
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
              debounce={200}
              value={filter}
              onChange={setFilter}
              placeholder={t('searchPlaceholder')}
              data-testid="emission-factor-search-input"
            />
          </FormControl>
          <FormControl>
            <FormLabel id="emission-factors-filter-location" component="legend">
              {t('locationSearch')}
            </FormLabel>
            <Autocomplete
              value={locationFilter}
              options={locationOptions}
              onChange={(_, option) => setLocationFilter(option || '')}
              onInputChange={(_, newInputValue) => setLocationFilter(newInputValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('locationSearchPlaceholder')}
                  sx={{
                    minWidth: '20rem',
                    '& .MuiOutlinedInput-root': { '& fieldset': { borderRadius: '0.25rem' } },
                    '& .MuiInputBase-input': { color: 'black' },
                  }}
                />
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
              value={filteredSources}
              onChange={selectSource}
              renderValue={statusSelectorRenderValue}
              multiple
            >
              {sortedImportVersions.map((importVersion) => (
                <MenuItem key={`source-item-${importVersion.id}`} value={importVersion.id}>
                  <Checkbox checked={filteredSources.includes(importVersion.id)} />
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
              value={filteredUnits}
              allValues={initialSelectedUnits.filter((unit) => unit != 'all')}
              setValues={setFilteredUnits}
              t={tUnits}
            />
          </FormControl>
          <FormControl className={styles.selector}>
            <FormLabel id="emissions-subposts-selector" component="legend">
              {t('subPosts')}
            </FormLabel>
            <Select
              id="emissions-subposts-selector"
              labelId="emissions-subposts-selector"
              value={filteredSubPosts}
              renderValue={subPostsSelectorRenderValue}
              multiple
            >
              <MenuItem
                key="subpost-item-all"
                className={allSelectedSubPosts ? 'Mui-selected' : ''} // dirty-hack because selected does not work on this option
                onClick={selectAllSubPosts}
              >
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
                      selected={filteredSubPosts.includes(subPost)}
                      onClick={() => selectSubPost(subPost)}
                    >
                      <Checkbox checked={filteredSubPosts.includes(subPost)} />
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
                  checked={displayArchived}
                  data-testid="archived-emissions-factors-switch"
                  onChange={(event) => setDisplayArchived(event.target.checked)}
                />
              }
              label={t(displayArchived ? 'yes' : 'no')}
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
