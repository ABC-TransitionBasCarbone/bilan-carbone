'use client'

import { SitesCommand } from '@/services/serverFunctions/study.command'
import { getUserSettings } from '@/services/serverFunctions/user'
import { CA_UNIT_VALUES, displayCA, formatNumber } from '@/utils/number'
import DeleteIcon from '@mui/icons-material/Delete'
import { SiteCAUnit } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { Control, UseFormGetValues, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'
import Button from '../base/Button'
import Help from '../base/HelpIcon'
import { FormCheckbox } from '../form/Checkbox'
import { FormTextField } from '../form/TextField'
import GlossaryModal from '../modals/GlossaryModal'
import styles from './Sites.module.css'

interface Props<T extends SitesCommand> {
  form?: UseFormReturn<T>
  sites: SitesCommand['sites']
  withSelection?: boolean
}

const Sites = <T extends SitesCommand>({ sites, form, withSelection }: Props<T>) => {
  const t = useTranslations('organization.sites')
  const tGlossary = useTranslations('organization.sites.glossary')
  const tUnit = useTranslations('settings.caUnit')
  const [caUnit, setCAUnit] = useState<SiteCAUnit>(SiteCAUnit.K)
  const [showGlossary, setShowGlossary] = useState(false)

  const control = form?.control as Control<SitesCommand>
  const setValue = form?.setValue as UseFormSetValue<SitesCommand>
  const getValues = form?.getValues as UseFormGetValues<SitesCommand>

  useEffect(() => {
    applyUserSettings()
  }, [])

  const applyUserSettings = async () => {
    const caUnit = (await getUserSettings())?.caUnit
    if (caUnit !== undefined) {
      setCAUnit(caUnit)
    }
  }

  const headerCAUnit = useMemo(() => tUnit(caUnit), [caUnit])

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
                    control={control}
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
                  control={control}
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
              control={control}
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
        header: t('ca', { unit: headerCAUnit }),
        accessorKey: 'ca',
        cell: ({ row, getValue }) =>
          form ? (
            <FormTextField
              data-testid="organization-sites-ca"
              type="number"
              className="w100"
              control={control}
              translation={t}
              name={`sites.${row.index}.ca`}
              slotProps={{
                htmlInput: { type: 'number', min: 0 },
                input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
              }}
            />
          ) : (
            `${formatNumber(displayCA(getValue<number>(), CA_UNIT_VALUES[caUnit]))}`
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
                setValue(
                  'sites',
                  getValues('sites').filter((site) => site.id !== id),
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
  }, [t, form, headerCAUnit])

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
          onClick={() => setValue('sites', [...sites, { id: uuidv4(), name: '', etp: 0, ca: 0, selected: false }])}
          className={styles.addButton}
          data-testid="add-site-button"
        >
          {t('add')}
        </Button>
      )}
      <table className="mt1">
        <caption>
          {t('title')}
          <Help className="ml-4" onClick={() => setShowGlossary(!showGlossary)} label={tGlossary('title')} />
        </caption>
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
      <GlossaryModal
        glossary={showGlossary ? 'title' : ''}
        onClose={() => setShowGlossary(false)}
        label="create-emission-factor"
        t={tGlossary}
      >
        <p className="mb-2">
          <b>{tGlossary('etp')} :</b> {tGlossary('etpDescription')}
        </p>
        <p className="mb-2">
          <b>{tGlossary('ca', { unit: headerCAUnit })} :</b> {tGlossary('caDescription', { unit: headerCAUnit })}
        </p>
      </GlossaryModal>
    </div>
  )
}

export default Sites
