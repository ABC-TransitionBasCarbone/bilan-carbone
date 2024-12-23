'use client'

import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import CheckIcon from '@mui/icons-material/Check'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
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
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
} from '@mui/material'
import { EmissionFactorStatus, Import } from '@prisma/client'
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
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import Button from '../base/Button'
import DebouncedInput from '../base/DebouncedInput'
import EmissionFactorDetails from './EmissionFactorDetails'
import styles from './Table.module.css'

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

const sources = Object.values(Import).map((source) => source)

interface Props {
  emissionFactors: EmissionFactorWithMetaData[]
  selectEmissionFactor?: (emissionFactor: EmissionFactorWithMetaData) => void
}

const EmissionFactorsTable = ({ emissionFactors, selectEmissionFactor }: Props) => {
  const t = useTranslations('emissionFactors.table')
  const tUnits = useTranslations('units')
  const [filter, setFilter] = useState('')
  const [displayArchived, setDisplayArchived] = useState(false)
  const [locationFilter, setLocationFilter] = useState('')
  const [filteredSources, setSources] = useState<Import[]>(sources)

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
        accessorFn: (emissionFactor) => `${emissionFactor.totalCo2} kgCO₂e/${tUnits(emissionFactor.unit)}`,
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
        cell: ({ getValue }) => {
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
            default:
              return (
                <span className={classNames(styles.importFrom, 'flex-cc')}>
                  <HomeWorkIcon />
                  {t('importedFrom.manual')}
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
  }, [emissionFactors, columns])

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
  }, [filter, locationFilter])

  const data = useMemo(() => {
    return searchedEmissionFactors
      .filter((emissionFactor) => filteredSources.includes(emissionFactor.importedFrom))
      .filter((emissionFactor) => displayArchived || emissionFactor.status !== EmissionFactorStatus.Archived)
  }, [searchedEmissionFactors, filteredSources, displayArchived])

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

    setSources(value as Import[])
  }

  const statusSelectorRenderValue = () =>
    filteredSources.length === sources.length ? t('all') : filteredSources.map((source) => t(source)).join(', ')

  return (
    <>
      <div className={classNames(styles.filters, 'align-center wrap mb1')}>
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
            {sources.map((source, i) => (
              <MenuItem key={`source-item-${i}`} value={source}>
                <Checkbox checked={filteredSources.includes(source)} />
                <ListItemText primary={source} />
              </MenuItem>
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
      </div>
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
                  <td key={cell.id} className={styles.cell} data-testid={`cell-emission-${cell.column.id}`}>
                    {cell.column.id === 'actions' ? (
                      <div className={styles.cellDiv}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                    ) : (
                      <button
                        className={styles.cellButton}
                        onClick={() => {
                          row.toggleExpanded()
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </button>
                    )}
                  </td>
                ))}
              </tr>,
            ]
            if (row.getIsExpanded()) {
              lines.push(
                <tr key={`todo${row.id}`}>
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
    </>
  )
}

export default EmissionFactorsTable
