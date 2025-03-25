'use client'

import { canEditEmissionFactor, EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { formatNumber } from '@/utils/number'
import DeleteIcon from '@mui/icons-material/Cancel'
import CheckIcon from '@mui/icons-material/Check'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EditIcon from '@mui/icons-material/Edit'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import InventoryIcon from '@mui/icons-material/Inventory'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  ListItemText,
  MenuItem,
  Button as MuiButton,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
} from '@mui/material'
import { EmissionFactorImportVersion, EmissionFactorStatus, Import, Unit } from '@prisma/client'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table'
import classNames from 'classnames'
import Fuse from 'fuse.js'
import { useTranslations } from 'next-intl'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
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
    {
      name: 'location',
      weight: 1,
    },
    {
      name: 'metaData.location',
      weight: 0.5,
    },
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
}

const initialSelectedUnits: (Unit | string)[] = [...['all', ''], ...Object.values(Unit)]

const EmissionFactorsTable = ({
  emissionFactors,
  selectEmissionFactor,
  userOrganizationId,
  importVersions,
  initialSelectedSources,
}: Props) => {
  const t = useTranslations('emissionFactors.table')
  const tUnits = useTranslations('units')
  const [action, setAction] = useState<'edit' | 'delete' | undefined>(undefined)
  const [targetedEmission, setTargetedEmission] = useState('')
  const [filter, setFilter] = useState('')
  const [displayArchived, setDisplayArchived] = useState(false)
  const [locationFilter, setLocationFilter] = useState('')
  const [filteredSources, setFilteredSources] = useState(initialSelectedSources)
  const [filteredUnits, setFilteredUnits] = useState(initialSelectedUnits)
  const [displayHideButton, setDisplayHideButton] = useState(false)
  const [displayFilters, setDisplayFilters] = useState(true)
  const filtersRef = useRef<HTMLDivElement>(null)
  const fromModal = !!selectEmissionFactor

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
            ? `${emissionFactor.metaData.title}${emissionFactor.metaData.attribute ? ` - ${emissionFactor.metaData.attribute}` : ''}${emissionFactor.metaData.frontiere ? ` - ${emissionFactor.metaData.frontiere}` : ''}${emissionFactor.metaData.location ? ` - ${emissionFactor.metaData.location}` : ''}`
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
          `${formatNumber(getEmissionFactorValue(emissionFactor), 5)} kgCO₂e/${tUnits(emissionFactor.unit || '')}`,
      },
      {
        header: t('location'),
        accessorKey: 'location',
        cell: ({ getValue }) => <span>{getValue<string>() || ' '}</span>,
      },
      {
        header: t('status'),
        accessorKey: 'status',
        cell: ({ getValue }) => {
          const status = getValue<EmissionFactorStatus>()
          switch (status) {
            case EmissionFactorStatus.Archived:
              return (
                <div className="flex-cc">
                  <InventoryIcon color="inherit" />
                </div>
              )
            default:
              return (
                <div className="flex-cc">
                  <CheckCircleIcon color="success" />
                </div>
              )
          }
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
                    title={t('importedFrom.legifrance')}
                  />
                </div>
              )
            case Import.NegaOctet:
              return (
                <div className="flex-cc">
                  <img className={styles.importFrom} src="/logos/negaOctet.png" title={t('importedFrom.negaOctet')} />
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
                      <MuiButton
                        aria-label={t('delete')}
                        title={t('delete')}
                        className={styles.editButton}
                        onClick={(e) => {
                          e.stopPropagation()
                          editEmissionFactor(row.original.id, 'delete')
                        }}
                        data-testid={`delete-emission-factor-button`}
                      >
                        <DeleteIcon color="error" />
                      </MuiButton>
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
  }, [t, selectEmissionFactor])

  const fuse = useMemo(() => {
    return new Fuse(emissionFactors, fuseOptions)
  }, [emissionFactors])

  const searchedEmissionFactors = useMemo(() => {
    if (!filter && !locationFilter) {
      return emissionFactors
    }
    const searchResults = filter ? fuse.search(filter).map(({ item }) => item) : emissionFactors

    if (locationFilter) {
      const locationFuse = new Fuse(searchResults, locationFuseOptions)
      return locationFuse.search(locationFilter).map(({ item }) => item)
    }
    return searchResults
  }, [emissionFactors, filter, locationFilter])

  const data = useMemo(
    () =>
      searchedEmissionFactors
        .filter(
          (emissionFactor) =>
            (emissionFactor.version && filteredSources.includes(emissionFactor.version.id)) ||
            (!emissionFactor.version && filteredSources.includes(Import.Manual)),
        )
        .filter((emissionFactor) => filteredUnits.includes(emissionFactor.unit || ''))
        .filter((emissionFactor) => displayArchived || emissionFactor.status !== EmissionFactorStatus.Archived),
    [searchedEmissionFactors, filteredSources, filteredUnits, displayArchived],
  )

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

  const onPaginationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const page = e.target.value ? Number(e.target.value) - 1 : 0
    if (page >= table.getPageCount()) {
      table.setPageIndex(table.getPageCount() - 1)
    } else {
      table.setPageIndex(page)
    }
  }

  const selectLocations = (event: SelectChangeEvent<typeof filteredSources>) => {
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
    [importVersions],
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

  return (
    <>
      <div ref={filtersRef} className={classNames(styles.filters, 'align-center wrap mt-2 mb1')}>
        {displayFilters && (
          <>
            <DebouncedInput
              className={styles.searchInput}
              debounce={200}
              value={filter}
              onChange={setFilter}
              placeholder={t('search')}
              data-testid="emission-factor-search-input"
            />
            <DebouncedInput
              className={styles.searchInput}
              debounce={200}
              value={locationFilter}
              onChange={setLocationFilter}
              placeholder={t('locationSearch')}
            />
            <FormControl className={styles.selector}>
              <InputLabel id="emissions-sources-selector">{t('sources')}</InputLabel>
              <Select
                id="emissions-sources-selector"
                labelId="emissions-sources-selector"
                value={filteredSources}
                onChange={selectLocations}
                input={<OutlinedInput label={t('sources')} />}
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
              <InputLabel id="emissions-unit-selector">{t('units')}</InputLabel>
              <MultiSelectAll
                id="emissions-unit"
                renderValue={unitsSelectorRenderValue}
                value={filteredUnits}
                allValues={initialSelectedUnits.filter((unit) => unit != 'all')}
                setValues={setFilteredUnits}
                t={tUnits}
                tLabel={t}
              />
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
            <Button color="secondary" onClick={() => setDisplayFilters(!displayFilters)}>
              {t(displayFilters ? 'hideFilters' : 'displayFilters')}
            </Button>
          </div>
        )}
      </div>
      <div className={classNames('grow', { [styles.modalTable]: fromModal })}>
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.flatMap((row) => {
              const lines = [
                <tr key={row.id} className={styles.line}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} data-testid={`cell-emission-${cell.column.id}`}>
                      {cell.column.id === 'actions' ? (
                        <div className={styles.cellDiv}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      ) : (
                        <div
                          className={styles.cellButton}
                          onClick={() => {
                            row.toggleExpanded()
                          }}
                        >
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
                    <td colSpan={columns.length} className={styles.detail}>
                      <EmissionFactorDetails emissionFactor={row.original} />
                    </td>
                  </tr>,
                )
              }
              return lines
            })}
          </tbody>
        </table>
      </div>
      <div className={classNames(styles.pagination, 'align-center mt1')}>
        <Button onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>
          {'<<'}
        </Button>
        <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          {'<'}
        </Button>
        <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {'>'}
        </Button>
        <Button onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>
          {'>>'}
        </Button>
        <p>
          {t('page', {
            page: table.getState().pagination.pageIndex + 1,
            total: (table.getPageCount() || 1).toLocaleString(),
          })}
        </p>
        {t('goTo')}
        <TextField
          type="number"
          classes={{ root: styles.pageInput }}
          slotProps={{
            htmlInput: { min: 1, max: table.getPageCount() },
            input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
          }}
          defaultValue={table.getState().pagination.pageIndex + 1}
          onChange={onPaginationChange}
        />
        <FormControl className={styles.selector}>
          <InputLabel id="emissions-paginator-count-selector">{t('items')}</InputLabel>
          <Select
            id="emissions-paginator-count-selector"
            labelId="emissions-paginator-count-selector"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            input={<OutlinedInput label={t('items')} />}
          >
            {[25, 50, 100, 200, 500].map((count) => (
              <MenuItem key={count} value={count}>
                <ListItemText primary={count} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
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
