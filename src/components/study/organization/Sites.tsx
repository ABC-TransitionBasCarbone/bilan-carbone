'use client'
import { FormCheckbox } from '@/components/form/Checkbox'
import { FormTextField } from '@/components/form/TextField'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import styles from './Sites.module.css'

interface Props {
  form: UseFormReturn<SitesCommand>
  sites: SitesCommand['sites']
}

const Sites = ({ form, sites }: Props) => {
  const t = useTranslations('organization.sites')

  const columns = useMemo(() => {
    return [
      {
        header: t('name'),
        accessorKey: 'name',
        cell: ({ row, getValue }) => (
          <div className={classNames(styles.name, 'align-center')}>
            <FormCheckbox
              control={form.control}
              translation={t}
              name={`sites.${row.index}.selected`}
              data-testid="organization-sites-checkbox"
            />
            {getValue<string>()}
          </div>
        ),
      },
      {
        header: t('etp'),
        accessorKey: 'etp',
        cell: ({ row }) => (
          <FormTextField
            type="number"
            className="w100"
            control={form.control}
            translation={t}
            name={`sites.${row.index}.etp`}
            slotProps={{
              htmlInput: { type: 'number', min: 0 },
              input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
            }}
            data-testid="organization-sites-etp"
          />
        ),
      },
      {
        header: t('ca'),
        accessorKey: 'ca',
        cell: ({ row }) => (
          <FormTextField
            type="number"
            className="w100"
            control={form.control}
            translation={t}
            name={`sites.${row.index}.ca`}
            slotProps={{
              htmlInput: { type: 'number', min: 0 },
              input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
            }}
            data-testid="organization-sites-ca"
          />
        ),
      },
    ] as ColumnDef<SitesCommand['sites'][0]>[]
  }, [t, form])

  const table = useReactTable({
    columns,
    data: sites,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
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
