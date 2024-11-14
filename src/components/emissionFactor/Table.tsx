'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Import } from '@prisma/client'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  PaginationState,
  getPaginationRowModel,
} from '@tanstack/react-table'
import Fuse from 'fuse.js'
import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import classNames from 'classnames'
import styles from './Table.module.css'
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
import Button from '../base/Button'
import DebouncedInput from '../base/DebouncedInput'
import LinkButton from '../base/LinkButton'

const fuseOptions = {
  keys: [
    {
      name: 'name',
      weight: 1,
    },
    {
      name: 'detail',
      weight: 0.5,
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
      name: 'sub-location',
      weight: 0.5,
      getFn: (emissionFactor: EmissionFactorWithMetaData) => emissionFactor.metaData?.location || '',
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
        accessorFn: (emissionFactor: EmissionFactorWithMetaData) => emissionFactor.metaData?.title,
      },
      {
        id: 'detail',
        header: t('detail'),
        cell: ({ getValue }: { getValue: () => string }) => {
          const value = getValue()
          if (!value) {
            return null
          }
          const lines = value.split('<br />')
          return lines.length === 1 ? (
            lines
          ) : (
            <>
              {lines[0]} <br /> {lines[1]}
            </>
          )
        },
        accessorFn: (emissionFactor: EmissionFactorWithMetaData) => {
          const attribute = emissionFactor.metaData?.attribute
          const comment = emissionFactor.metaData?.comment
          if (attribute && comment) {
            return `${attribute}<br />${comment}`
          }
          if (attribute) {
            return attribute
          }
          if (comment) {
            return comment
          }
        },
      },
      { header: t('value'), accessorKey: 'totalCo2' },
      {
        header: t('unit'),
        accessorFn: (emissionFactor: EmissionFactorWithMetaData) => `kgCO₂e/${tUnits(emissionFactor.unit)}`,
      },
      {
        header: t('location'),
        accessorFn: (emissionFactor: EmissionFactorWithMetaData) =>
          [emissionFactor.location, emissionFactor.metaData?.location].join(' '),
      },
      { header: t('source'), accessorKey: 'source' },
    ]
  }, [t])

  const fuse = useMemo(() => {
    return new Fuse(emissionFactors, {
      ...fuseOptions,
      getFn: (emissionFactor, keys) => {
        const column = columns.find((column) => keys.includes(column.id || ''))
        if (!column || !column.accessorFn) {
          return ''
        }
        return (column.accessorFn(emissionFactor) || '').toString()
      },
    })
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
            placeholder={t('location-search')}
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
          slotProps={{ htmlInput: { min: 1, max: table.getPageCount() } }}
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
