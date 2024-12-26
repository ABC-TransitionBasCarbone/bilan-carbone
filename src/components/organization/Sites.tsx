'use client'

import { OrganizationWithSites } from '@/db/user'
import { UpdateOrganizationCommand } from '@/services/serverFunctions/organization.command'
import DeleteIcon from '@mui/icons-material/Delete'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'
import Button from '../base/Button'
import LinkButton from '../base/LinkButton'
import { FormTextField } from '../form/TextField'
import styles from './Sites.module.css'

interface Props {
  sites: OrganizationWithSites['sites']
  form?: UseFormReturn<UpdateOrganizationCommand>
  studyId?: string
}

const Sites = ({ sites, form, studyId }: Props) => {
  const t = useTranslations('organization.sites')

  const columns = useMemo(() => {
    const columns = [
      {
        id: 'name',
        header: t('name'),
        accessorKey: 'name',
        cell: ({ row, getValue }) =>
          form ? (
            <FormTextField
              data-testid="edit-site-name"
              className="w100"
              control={form.control}
              translation={t}
              name={`sites.${row.index}.name`}
            />
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
              data-testid="edit-site-etp"
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
            getValue<number>()
          ),
      },
      {
        id: 'ca',
        header: t('ca'),
        accessorKey: 'ca',
        cell: ({ row, getValue }) =>
          form ? (
            <FormTextField
              data-testid="edit-site-ca"
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
            `${getValue<number>()}€`
          ),
      },
    ] as ColumnDef<OrganizationWithSites['sites'][0]>[]
    if (form) {
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
      {form && (
        <Button
          onClick={() => form.setValue('sites', [...sites, { id: uuidv4(), name: '', etp: 0, ca: 0 }])}
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
      {!form && (
        <div className="mt1 grow justify-end">
          <LinkButton
            href={`/etudes/${studyId}/perimetre/modifier`}
            className="align-right"
            data-testid="edit-study-sites"
          >
            {t('update')}
          </LinkButton>
        </div>
      )}
    </div>
  )
}

export default Sites
