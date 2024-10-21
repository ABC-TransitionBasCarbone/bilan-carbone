'use client'

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  PaginationState,
  getPaginationRowModel,
} from '@tanstack/react-table'
import Fuse from 'fuse.js'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import Button from '../base/Button'
import classNames from 'classnames'
import styles from './Table.module.css'
import Input from '../base/Input'
import DebouncedInput from '../base/DebouncedInput'
import { EmissionWithMetaData } from '@/services/emissions'

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

interface Props {
  emissions: EmissionWithMetaData[]
}

const EmissionsTable = ({ emissions }: Props) => {
  const t = useTranslations('emissions.table')
  const [filter, setFilter] = useState('')

  const columns = useMemo(() => {
    return [
      {
        id: 'name',
        header: t('name'),
        accessorFn: (emission: EmissionWithMetaData) => emission.metaData?.title,
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
        accessorFn: (emission: EmissionWithMetaData) => {
          const attribute = emission.metaData?.attribute
          const comment = emission.metaData?.comment
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
      { header: t('valeur'), accessorFn: (emission: EmissionWithMetaData) => emission.totalCo2 },
      {
        header: t('unit'),
        accessorFn: (emission: EmissionWithMetaData) => emission.metaData?.unit?.replaceAll('/', ` ${t('per')} `),
      },
      { header: t('quality'), accessorFn: (emission: EmissionWithMetaData) => emission.quality },
      { header: t('status'), accessorFn: (emission: EmissionWithMetaData) => t(emission.status) },
      {
        header: t('location'),
        accessorFn: (emission: EmissionWithMetaData) => [emission.location, emission.metaData?.location].join(' '),
      },
      { header: t('source'), accessorFn: (emission: EmissionWithMetaData) => emission.source },
    ]
  }, [t])

  const fuse = useMemo(() => {
    return new Fuse(emissions, {
      ...fuseOptions,
      getFn: (emission, keys) => {
        const column = columns.find((column) => keys.includes(column.id || ''))
        if (!column || !column.accessorFn) {
          return ''
        }
        return (column.accessorFn(emission) || '').toString()
      },
    })
  }, [emissions, columns])

  const data = useMemo(() => {
    if (!filter) {
      return emissions
    }
    const results = fuse.search(filter)
    return results.map(({ item }) => item)
  }, [filter])

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  })

  return (
    <>
      <DebouncedInput
        className={classNames(styles.searchInput, 'mb1')}
        debounce={200}
        value={filter}
        onChange={setFilter}
        placeholder={t('search')}
      />
      <table className={styles.table}>
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
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
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
          {t('page', { page: table.getState().pagination.pageIndex + 1, total: table.getPageCount().toLocaleString() })}
        </p>
        <div>
          {t('goTo')}
          <Input
            type="number"
            min="1"
            max={table.getPageCount()}
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
          />
        </div>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value))
          }}
        >
          {[25, 50, 100, 200, 500].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>
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

export default EmissionsTable
