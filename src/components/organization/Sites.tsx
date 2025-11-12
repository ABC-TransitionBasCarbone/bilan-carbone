'use client'

import BaseTable from '@/components/base/Table'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { defaultCAUnit } from '@/utils/number'
import { Environment, SiteCAUnit } from '@prisma/client'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { UseFormReturn, UseFormSetValue } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'
import Button from '../base/Button'
import Help from '../base/HelpIcon'
import GlossaryModal from '../modals/GlossaryModal'

type TypeDef = SitesCommand['sites'][number]

interface Props<T extends SitesCommand> {
  form?: UseFormReturn<T>
  sites: SitesCommand['sites']
  withSelection?: boolean
  columns: ColumnDef<TypeDef>[]
  caUnit?: SiteCAUnit
  environment: Environment
}

const Sites = <T extends SitesCommand>({ sites, form, withSelection, columns, caUnit, environment }: Props<T>) => {
  const t = useTranslations('organization.sites')
  const tGlossary = useTranslations('organization.sites.glossary')
  const tUnit = useTranslations('settings.caUnit')
  const [showGlossary, setShowGlossary] = useState(false)

  const setValue = form?.setValue as UseFormSetValue<SitesCommand>

  const newSite = () => ({ id: uuidv4(), name: '', selected: false }) as SitesCommand['sites'][0]

  const headerCAUnit = useMemo(() => tUnit(caUnit ?? defaultCAUnit), [caUnit, tUnit])

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
            {environment !== Environment.CUT && (
              <span className="inputLabel bold align-center">
                {t('title')}
                <Help
                  className="ml-4 pointer"
                  onClick={() => setShowGlossary(!showGlossary)}
                  label={tGlossary('title')}
                />
              </span>
            )}
          </p>
          {form && !withSelection && (
            <Button onClick={() => setValue('sites', [...sites, newSite()])} data-testid="add-site-button">
              {t('add')}
            </Button>
          )}
        </div>
      </div>
      <BaseTable table={table} className="mt1" testId="sites" />
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
        {environment === Environment.TILT && (
          <p className="mb-2">
            <b>{tGlossary('volunteer')} :</b> {tGlossary('volunteerDescription')}
          </p>
        )}
      </GlossaryModal>
    </div>
  )
}

export default Sites
