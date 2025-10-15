/* eslint-disable @next/next/no-img-element */
'use client'

import BaseTable from '@/components/base/Table'
import { canEditEmissionFactor } from '@/services/permissions/emissionFactor'
import { Post, subPostsByPost } from '@/services/posts'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { BCUnit } from '@/services/unit'
import { filterEmissionFactorsBySubPostAndEnv, getEmissionFactorValue } from '@/utils/emissionFactors'
import { formatEmissionFactorNumber } from '@/utils/number'
import DeleteIcon from '@mui/icons-material/Cancel'
import CheckIcon from '@mui/icons-material/Check'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EditIcon from '@mui/icons-material/Edit'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import InventoryIcon from '@mui/icons-material/Inventory'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import {
  Autocomplete,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  ListItemText,
  MenuItem,
  Button as MuiButton,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
} from '@mui/material'
import {
  EmissionFactorImportVersion,
  EmissionFactorStatus,
  Environment,
  Import,
  StudyResultUnit,
  SubPost,
} from '@prisma/client'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  PaginationState,
  Row,
  useReactTable,
} from '@tanstack/react-table'
import classNames from 'classnames'
import Fuse from 'fuse.js'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../base/Button'
import DebouncedInput from '../base/DebouncedInput'
import MultiSelectAll from '../base/MultiSelectAll'
import EmissionFactorDetails from './EmissionFactorDetails'
import styles from './Table.module.css'
import EditEmissionFactorModal from './edit/EditEmissionFactorModal'

const fuseOptions = {
  keys: [
    {
      name: 'metaData.title',
      weight: 1,
    },
    {
      name: 'metaData.attribute',
      weight: 0.5,
    },
    {
      name: 'metaData.frontiere',
      weight: 0.4,
    },
    {
      name: 'metaData.comment',
      weight: 0.3,
    },
  ],
  threshold: 0.3,
  isCaseSensitive: false,
}

const locationFuseOptions = {
  keys: [
    { name: 'location', weight: 1 },
    { name: 'metaData.location', weight: 0.5 },
    { name: 'combinedLocation', weight: 1.5 },
  ],
  threshold: 0.3,
  isCaseSensitive: false,
}

interface Props {
  emissionFactors: EmissionFactorWithMetaData[]
  selectEmissionFactor?: (emissionFactor: EmissionFactorWithMetaData) => void
  importVersions: EmissionFactorImportVersion[]
  initialSelectedSources: string[]
  userOrganizationId?: string | null
  initialSelectedSubPosts: SubPost[]
  environment: Environment
  envPosts: Post[]
}

const initialSelectedUnits: (BCUnit | string)[] = [...['all'], ...Object.values(BCUnit)]

const EmissionFactorsTable = ({
  emissionFactors,
  selectEmissionFactor,
  userOrganizationId,
  importVersions,
  initialSelectedSources,
  initialSelectedSubPosts,
  environment,
  envPosts,
}: Props) => {
  const t = useTranslations('emissionFactors.table')
  const tUnits = useTranslations('units')
  const tPosts = useTranslations('emissionFactors.post')
  const tResultUnits = useTranslations('study.results.units')
  const [action, setAction] = useState<'edit' | 'delete' | undefined>(undefined)
  const [targetedEmission, setTargetedEmission] = useState('')
  const [filter, setFilter] = useState('')
  const [displayArchived, setDisplayArchived] = useState(false)
  const [locationFilter, setLocationFilter] = useState('')
  const [filteredSources, setFilteredSources] = useState(initialSelectedSources)
  const [filteredUnits, setFilteredUnits] = useState(initialSelectedUnits)
  const [filteredSubPosts, setFilteredSubPosts] = useState(initialSelectedSubPosts)
  const [displayHideButton, setDisplayHideButton] = useState(false)
  const [displayFilters, setDisplayFilters] = useState(true)
  const filtersRef = useRef<HTMLDivElement>(null)
  const fromModal = !!selectEmissionFactor

  const envSubPosts = useMemo(() => {
    return envPosts.reduce((acc, post) => {
      const subPosts = subPostsByPost[post] || []
      return acc.concat(subPosts)
    }, [] as SubPost[])
  }, [envPosts])

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

  const getLocationLabel = useMemo(
    () => (row: EmissionFactorWithMetaData) =>
      `${row.location || t('noLocation')}${row.metaData?.location ? ` - ${row.metaData.location}` : ''}`,
    [t],
  )

  const editEmissionFactor = async (emissionFactorId: string, action: 'edit' | 'delete') => {
    if (!(await canEditEmissionFactor(emissionFactorId))) {
      return
    }
    setTargetedEmission(emissionFactorId)
    setAction(action)
  }

  const columns = useMemo(() => {
    const columnsToReturn = [
      {
        id: 'name',
        header: t('name'),
        accessorFn: (emissionFactor) =>
          emissionFactor.metaData
            ? `${emissionFactor.metaData.title}${emissionFactor.metaData.attribute ? ` - ${emissionFactor.metaData.attribute}` : ''}${emissionFactor.metaData.frontiere ? ` - ${emissionFactor.metaData.frontiere}` : ''}`
            : '',
        cell: ({ getValue, row }) => (
          <div className="align-center">
            {row.getIsExpanded() ? (
              <KeyboardArrowDownIcon className={styles.svg} />
            ) : (
              <KeyboardArrowRightIcon className={styles.svg} />
            )}
            <span className={styles.name}>{getValue<string>()}</span>
          </div>
        ),
      },
      {
        header: t('value'),
        accessorFn: (emissionFactor) =>
          `${formatEmissionFactorNumber(getEmissionFactorValue(emissionFactor, environment))} ${tResultUnits(StudyResultUnit.K)}/${emissionFactor.unit === BCUnit.CUSTOM ? emissionFactor.customUnit : tUnits(emissionFactor.unit || '')}`,
      },
      {
        header: t('location'),
        accessorFn: (emissionFactor) => getLocationLabel(emissionFactor),
        cell: ({ getValue }) => <span>{getValue<string>() || ' '}</span>,
      },
      {
        header: t('status'),
        accessorKey: 'status',
        cell: ({ getValue }) => {
          const status = getValue<EmissionFactorStatus>()
          const Icon =
            status === EmissionFactorStatus.Archived ? (
              <InventoryIcon color="inherit" />
            ) : (
              <CheckCircleIcon color="success" />
            )

          return (
            <div className="flex-cc" aria-label={t(status)} title={t(status)}>
              {Icon}
            </div>
          )
        },
      },
      {
        header: t('source'),
        accessorKey: 'importedFrom',
        cell: ({ getValue, row }) => {
          const importedFrom = getValue<Import>()
          switch (importedFrom) {
            case Import.BaseEmpreinte:
              return (
                <div className="flex-cc">
                  <img
                    className={styles.importFrom}
                    src="https://base-empreinte.ademe.fr/assets/img/base-empreinte.svg"
                    alt="Base empreinte"
                    title={t('importedFrom.baseEmpreinte')}
                  />
                </div>
              )
            case Import.Legifrance:
              return (
                <div className="flex-cc">
                  <img
                    className={styles.importFrom}
                    src="https://www.legifrance.gouv.fr/contenu/logo"
                    alt="Legifrance"
                    title={t('importedFrom.legifrance')}
                  />
                </div>
              )
            case Import.NegaOctet:
              return (
                <div className="flex-cc">
                  <img
                    className={styles.importFrom}
                    src="/logos/negaOctet.png"
                    title={t('importedFrom.negaOctet')}
                    alt="Negaoctet"
                  />
                </div>
              )
            default:
              return (
                <span className={classNames(styles.importFrom, 'flex-cc')}>
                  <HomeWorkIcon />
                  {t('Manual')}
                  {!selectEmissionFactor && userOrganizationId === row.original.organizationId && (
                    <>
                      <MuiButton
                        aria-label={t('edit')}
                        title={t('edit')}
                        className={styles.editButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          editEmissionFactor(row.original.id, 'edit')
                        }}
                        data-testid={`edit-emission-factor-button`}
                      >
                        <EditIcon color="info" />
                      </MuiButton>
                      <Button
                        aria-label={t('delete')}
                        title={t('delete')}
                        className={styles.editButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          editEmissionFactor(row.original.id, 'delete')
                        }}
                        data-testid={`delete-emission-factor-button`}
                        color="error"
                        variant="text"
                      >
                        <DeleteIcon />
                      </Button>
                    </>
                  )}
                </span>
              )
          }
        },
      },
    ] as ColumnDef<EmissionFactorWithMetaData>[]

    if (selectEmissionFactor) {
      columnsToReturn.push({
        id: 'actions',
        header: '',
        accessorKey: 'id',
        cell: ({ row }) => (
          <Button
            aria-label={t('selectLine')}
            title={t('selectLine')}
            onClick={() => selectEmissionFactor(row.original)}
          >
            <CheckIcon />
          </Button>
        ),
      })
    }

    return columnsToReturn
  }, [t, selectEmissionFactor, environment, tResultUnits, tUnits, getLocationLabel, userOrganizationId])

  const fuse = useMemo(() => {
    return new Fuse(emissionFactors, fuseOptions)
  }, [emissionFactors])

  const searchedEmissionFactors = useMemo(() => {
    if (!filter && !locationFilter) {
      return emissionFactors
    }
    const searchResults = filter ? fuse.search(filter).map(({ item }) => item) : emissionFactors

    if (locationFilter) {
      const enhancedSearchResults = searchResults.map((item) => ({
        ...item,
        combinedLocation: getLocationLabel(item),
      }))
      const locationFuse = new Fuse(enhancedSearchResults, locationFuseOptions)
      return locationFuse.search(locationFilter).map(({ item }) => item)
    }
    return searchResults
  }, [emissionFactors, filter, fuse, getLocationLabel, locationFilter])

  const data = useMemo(() => {
    const emissionFactorsAllSubposts = searchedEmissionFactors.filter((emissionFactor) => {
      const isInRightSources =
        (emissionFactor.version && filteredSources.includes(emissionFactor.version.id)) ||
        (!emissionFactor.version && filteredSources.includes(Import.Manual))

      const isWithGoodUnit = filteredUnits.includes(emissionFactor.unit || '')

      const isWithGoodArchivedStatus = displayArchived || emissionFactor.status !== EmissionFactorStatus.Archived

      return isInRightSources && isWithGoodUnit && isWithGoodArchivedStatus
    })

    return filterEmissionFactorsBySubPostAndEnv(emissionFactorsAllSubposts, filteredSubPosts, environment)
  }, [searchedEmissionFactors, filteredSubPosts, environment, filteredSources, filteredUnits, displayArchived])

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getRowCanExpand: () => true,
    getExpandedRowModel: getExpandedRowModel(),
    state: { pagination },
  })

  useEffect(() => {
    table.toggleAllRowsExpanded(false)
  }, [table, data])

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

  const getEmissionVersionLabel = (version?: EmissionFactorImportVersion) =>
    version ? `${t(version.source)} ${version.name}` : ''

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
      data
        .map((emissionFactor) => getLocationLabel(emissionFactor))
        .filter(
          (location, i) => data.map((emissionFactor) => getLocationLabel(emissionFactor)).indexOf(location) === i,
        ),
    [data, getLocationLabel],
  )

  const Row = (row: Row<EmissionFactorWithMetaData>) => {
    const lines = [
      <tr key={row.id} className={classNames(styles.line, { [styles.open]: row.getIsExpanded() })}>
        {row.getVisibleCells().map((cell) => (
          <td key={cell.id} data-testid={`cell-emission-${cell.column.id}`}>
            {cell.column.id === 'actions' ? (
              <div className={styles.cellDiv}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
            ) : (
              <div className={styles.cellButton} onClick={() => row.toggleExpanded()}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            )}
          </td>
        ))}
      </tr>,
    ]
    if (row.getIsExpanded()) {
      lines.push(
        <tr key={`${row.id}-details`}>
          <td colSpan={columns.length} className={classNames(styles.detail, 'p1')}>
            <EmissionFactorDetails emissionFactor={row.original} />
          </td>
        </tr>,
      )
    }
    return lines
  }

  return (
    <>
      <BaseTable
        table={table}
        t={t}
        title="subTitle"
        paginations={[25, 50, 100, 200, 500]}
        className={classNames('grow', { [styles.modalTable]: fromModal })}
        customRow={Row}
        testId="emissionfactors"
      >
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
                      <MenuItem
                        key={`subpost-${post}`}
                        selected={areAllSelected(post)}
                        onClick={() => selectPost(post)}
                      >
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
      </BaseTable>

      <div>
        {t('showing', {
          number: table.getRowModel().rows.length.toLocaleString(),
          total: table.getRowCount().toLocaleString(),
        })}
      </div>
      <EditEmissionFactorModal emissionFactorId={targetedEmission} action={action} setAction={setAction} />
    </>
  )
}

export default EmissionFactorsTable
