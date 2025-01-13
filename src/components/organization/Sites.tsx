'use client'

import { SitesCommand } from '@/services/serverFunctions/study.command'
import { formatNumber } from '@/utils/number'
import DeleteIcon from '@mui/icons-material/Delete'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'
import Button from '../base/Button'
import { FormCheckbox } from '../form/Checkbox'
import { FormTextField } from '../form/TextField'
import styles from './Sites.module.css'

interface Props {
  form?: UseFormReturn<SitesCommand>
  sites: SitesCommand['sites']
  withSelection?: boolean
}

const Sites = ({ sites, form, withSelection }: Props) => {
  const t = useTranslations('organization.sites')

  const columns = useMemo(() => {
    const columns = [
      {
        id: 'name',
        header: t('name'),
        accessorKey: 'name',
        cell: ({ row, getValue }) =>
          form ? (
            <>
              {withSelection ? (
                <div className={classNames(styles.name, 'align-center')}>
                  <FormCheckbox
                    control={form.control}
                    translation={t}
                    name={`sites.${row.index}.selected`}
                    data-testid="organization-sites-checkbox"
                  />
                  {getValue<string>()}
                </div>
              ) : (
                <FormTextField
                  data-testid="edit-site-name"
                  className="w100"
                  control={form.control}
                  translation={t}
                  name={`sites.${row.index}.name`}
                />
              )}
            </>
          ) : (
            getValue<string>()
          ),
      },
      {
        id: 'etp',
        header: t('etp'),
        accessorKey: 'etp',
        cell: ({ row, getValue }) =>
          form ? (
            <FormTextField
              data-testid="organization-sites-etp"
              type="number"
              className="w100"
              control={form.control}
              translation={t}
              name={`sites.${row.index}.etp`}
              slotProps={{
                htmlInput: { type: 'number', min: 0 },
                input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
              }}
            />
          ) : (
            formatNumber(getValue<number>())
          ),
      },
      {
        id: 'ca',
        header: t('ca'),
        accessorKey: 'ca',
        cell: ({ row, getValue }) =>
          form ? (
            <FormTextField
              data-testid="organization-sites-ca"
              type="number"
              className="w100"
              control={form.control}
              translation={t}
              name={`sites.${row.index}.ca`}
              slotProps={{
                htmlInput: { type: 'number', min: 0 },
                input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
              }}
            />
          ) : (
            `${formatNumber(getValue<number>() / 1000)}`
          ),
      },
    ] as ColumnDef<SitesCommand['sites'][0]>[]
    if (form && !withSelection) {
      columns.push({
        id: 'delete',
        header: t('actions'),
        accessorKey: 'id',
        cell: ({ getValue }) => (
          <div className={classNames(styles.delete, 'w100 flex-cc')}>
            <Button
              data-testid="delete-site-button"
              title={t('delete')}
              aria-label={t('delete')}
              onClick={() => {
                const id = getValue<string>()
                form.setValue(
                  'sites',
                  form.getValues('sites').filter((site) => site.id !== id),
                )
              }}
            >
              <DeleteIcon />
            </Button>
          </div>
        ),
      })
    }
    return columns
  }, [t, form])

  const table = useReactTable({
    columns,
    data: sites,
    getCoreRowModel: getCoreRowModel(),
  })
  return !form && sites.length === 0 ? (
    <p className="title-h3">{t('noSites')}</p>
  ) : (
    <div className={styles.container}>
      {form && !withSelection && (
        <Button
          onClick={() => form.setValue('sites', [...sites, { id: uuidv4(), name: '', etp: 0, ca: 0, selected: false }])}
          className={styles.addButton}
          data-testid="add-site-button"
        >
          {t('add')}
        </Button>
      )}
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
        <tbody data-testid="sites-table-body">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Sites
