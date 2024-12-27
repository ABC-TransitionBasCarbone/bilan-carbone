'use client'

import { OrganizationWithSites } from '@/db/user'
import { UpdateOrganizationCommand } from '@/services/serverFunctions/organization.command'
import { ChangeStudyPerimeterCommand, CreateStudyCommand } from '@/services/serverFunctions/study.command'
import DeleteIcon from '@mui/icons-material/Delete'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import Button from '../base/Button'
import { FormCheckbox } from '../form/Checkbox'
import { FormTextField } from '../form/TextField'
import styles from './Sites.module.css'

interface Props {
  sites: OrganizationWithSites['sites'] | CreateStudyCommand['sites'] | ChangeStudyPerimeterCommand['sites']
  form:
    | UseFormReturn<UpdateOrganizationCommand>
    | UseFormReturn<CreateStudyCommand>
    | UseFormReturn<ChangeStudyPerimeterCommand>
  studyId?: string
  addSite?: () => void
  removeSite?: (id: string) => void
}

const Sites = ({ sites, form, studyId, addSite, removeSite }: Props) => {
  const isOrganizationForm = !studyId
  const isNewStudyForm = studyId === 'new'
  const t = useTranslations('organization.sites')

  const columns = useMemo(() => {
    const columns = [
      {
        id: 'name',
        header: t('name'),
        accessorKey: 'name',
        cell: ({ row, getValue }) => {
          return isOrganizationForm ? (
            <FormTextField
              className="w100"
              control={form.control}
              name={`sites.${row.index}.name`}
              translation={t}
              data-testid="edit-site-name"
            />
          ) : (
            <div className="align-center">
              <FormCheckbox
                control={form.control}
                name={`sites.${row.index}.selected`}
                translation={t}
                data-testid="organization-sites-checkbox"
              />
              {getValue<string>()}
            </div>
          )
        },
      },
      {
        id: 'etp',
        header: t('etp'),
        accessorKey: 'etp',
        cell: ({ row, getValue }) =>
          isOrganizationForm || isNewStudyForm ? (
            <FormTextField
              type="number"
              className="w100"
              control={form.control}
              name={`sites.${row.index}.etp`}
              translation={t}
              slotProps={{
                htmlInput: { type: 'number', min: 0 },
                input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
              }}
              data-testid="edit-site-etp"
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
          isOrganizationForm || isNewStudyForm ? (
            <FormTextField
              type="number"
              className="w100"
              control={form.control}
              name={`sites.${row.index}.ca`}
              translation={t}
              slotProps={{
                htmlInput: { type: 'number', min: 0 },
                input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
              }}
              data-testid="edit-site-ca"
            />
          ) : (
            `${getValue<number>()}€`
          ),
      },
    ] as ColumnDef<OrganizationWithSites['sites'][0]>[]
    if (isOrganizationForm) {
      columns.push({
        id: 'delete',
        header: t('actions'),
        accessorKey: 'id',
        cell: ({ getValue }) => (
          <div className={classNames(styles.delete, 'w100 flex-cc')}>
            <Button
              aria-label={t('delete')}
              title={t('delete')}
              onClick={() => {
                if (removeSite) {
                  const id = getValue<string>()
                  removeSite(id)
                }
              }}
              data-testid="delete-site-button"
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
      {isOrganizationForm && (
        <Button onClick={addSite} className={styles.addButton} data-testid="add-site-button">
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
