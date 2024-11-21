'use client'

import { OrganizationWithSites } from '@/db/user'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

interface Props {
  sites: OrganizationWithSites['sites']
}

const Sites = ({ sites }: Props) => {
  const t = useTranslations('organization.sites')

  const columns = useMemo(() => {
    return [
      {
        id: 'name',
        header: t('name'),
        accessorKey: 'name',
      },
      {
        id: 'etp',
        header: t('etp'),
        accessorKey: 'etp',
      },
      {
        id: 'ca',
        header: t('ca'),
        accessorFn: (site: OrganizationWithSites['sites'][0]) => site.ca.toLocaleString() + '€',
      },
    ]
  }, [t])

  const table = useReactTable({
    columns,
    data: sites,
    getCoreRowModel: getCoreRowModel(),
  })
  return sites.length === 0 ? (
    <p className="title-h3">{t('noSites')}</p>
  ) : (
    <table className="mt1">
      <caption>{t('title')}</caption>
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
  )
}

export default Sites
