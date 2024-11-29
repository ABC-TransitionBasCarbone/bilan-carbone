'use client'
import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material'
import { Import } from '@prisma/client'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table'
import classNames from 'classnames'
import Fuse from 'fuse.js'
import { useTranslations } from 'next-intl'
import { ChangeEvent, useMemo, useState } from 'react'
import Button from '../base/Button'
import DebouncedInput from '../base/DebouncedInput'
import LinkButton from '../base/LinkButton'
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
}

const sources = Object.values(Import).map((source) => source)

const EmissionFactorsTable = ({ emissionFactors }: Props) => {
  const t = useTranslations('emissionFactors.table')
  const tUnits = useTranslations('units')
  const [filter, setFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [filteredSources, setSources] = useState<Import[]>(sources)

  const columns = useMemo(() => {
    return [
      {
        id: 'name',
        header: t('name'),
        accessorFn: (emissionFactor) =>
          emissionFactor.metaData
            ? `${emissionFactor.metaData.title}${emissionFactor.metaData.attribute ? ` - ${emissionFactor.metaData.attribute}` : ''}`
            : '',
        cell: ({ getValue }) => <span className={styles.name}>{getValue<string>()}</span>,
      },
      {
        header: t('value'),
        accessorFn: (emissionFactor) => `${emissionFactor.totalCo2} kgCO₂e/${tUnits(emissionFactor.unit)}`,
      },
      {
        header: t('location'),
        accessorKey: 'location',
      },
      {
        header: t('source'),
        accessorKey: 'importedFrom',
        cell: ({ getValue }) => {
          const importedFrom = getValue<Import>()
          switch (importedFrom) {
            case Import.BaseEmpreinte:
              return (
                <img
                  className={styles.importFrom}
                  src="https://base-empreinte.ademe.fr/assets/img/base-empreinte.svg"
                  title={t('importedFrom.baseEmpreinte')}
                />
              )
            default:
              return (
                <span className={styles.importFrom}>
                  <HomeWorkIcon />
                  {t('importedFrom.manual')}
                </span>
              )
          }
          return null
        },
      },
    ] as ColumnDef<EmissionFactorWithMetaData>[]
  }, [t])

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
    return searchedEmissionFactors.filter((emissionFactor) => filteredSources.includes(emissionFactor.importedFrom))
  }, [searchedEmissionFactors, filteredSources])

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { pagination },
  })

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
      <div className={classNames(styles.header, 'justify-between align-center wrap-reverse mb1')}>
        <div className={classNames(styles.filters, 'wrap')}>
          <DebouncedInput
            className={styles.searchInput}
            debounce={200}
            value={filter}
            onChange={setFilter}
            placeholder={t('search')}
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
        </div>
        <LinkButton href="/facteurs-d-emission/creer" data-testid="new-emission">
          {t('add')}
        </LinkButton>
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
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} data-testid={`cell-emission-${cell.column.id}`}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
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
