'use client'

import { SitesCommand } from '@/services/serverFunctions/study.command'
import { defaultCAUnit } from '@/utils/number'
import { SiteCAUnit } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { UseFormReturn, UseFormSetValue } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'
import Button from '../base/Button'
import Help from '../base/HelpIcon'
import GlossaryModal from '../modals/GlossaryModal'

interface Props<T extends SitesCommand> {
  form?: UseFormReturn<T>
  sites: SitesCommand['sites']
  withSelection?: boolean
  columns: ColumnDef<SitesCommand['sites'][0]>[]
  caUnit?: SiteCAUnit
}

const Sites = <T extends SitesCommand>({ sites, form, withSelection, columns, caUnit }: Props<T>) => {
  const t = useTranslations('organization.sites')
  const tGlossary = useTranslations('organization.sites.glossary')
  const tUnit = useTranslations('settings.caUnit')
  const [showGlossary, setShowGlossary] = useState(false)

  const setValue = form?.setValue as UseFormSetValue<SitesCommand>

  const newSite = () => ({ id: uuidv4(), name: '', selected: false }) as SitesCommand['sites'][0]

  const headerCAUnit = useMemo(() => tUnit(caUnit ?? defaultCAUnit), [caUnit])

  const table = useReactTable({
    columns,
    data: sites,
    getCoreRowModel: getCoreRowModel(),
  })

  return !form && sites.length === 0 ? (
    <p className="title-h3">{t('noSites')}</p>
  ) : (
    <div>
      <div>
        <div className="justify-between align-center">
          <p className="title-h3">
            {t('title')}
            <Help className="ml-4" onClick={() => setShowGlossary(!showGlossary)} label={tGlossary('title')} />
          </p>
          {form && !withSelection && (
            <Button onClick={() => setValue('sites', [...sites, newSite()])} data-testid="add-site-button">
              {t('add')}
            </Button>
          )}
        </div>
      </div>
      <table className="mt1">
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
                <td className={form ? 'py0' : ''} key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
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
