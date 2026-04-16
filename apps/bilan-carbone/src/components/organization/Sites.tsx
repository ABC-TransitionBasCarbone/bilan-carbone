'use client'

import BaseTable from '@/components/base/Table'
import {
  hasAccessToStudySiteAddAndSelection,
  hasCustomGlossaryTextForEstablishment,
} from '@/services/permissions/environment'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { defaultCAUnit } from '@/utils/number'
import { Environment, SiteCAUnit } from '@repo/db-common/enums'
import { Checkbox, FormControlLabel } from '@mui/material'
import { Button } from '@repo/ui'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { UseFormReturn, UseFormSetValue } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'
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
  disabled?: boolean
}

const Sites = <T extends SitesCommand>({
  sites,
  form,
  withSelection,
  columns,
  caUnit,
  environment,
  disabled,
}: Props<T>) => {
  const t = useTranslations('organization.sites')
  const tCommon = useTranslations('common.action')
  const tGlossary = useTranslations('organization.sites.glossary')
  const tUnit = useTranslations('settings.caUnit')
  const [showGlossary, setShowGlossary] = useState(false)

  const setValue = form?.setValue as UseFormSetValue<SitesCommand>
  const canAddSite = !disabled && form && !withSelection && hasAccessToStudySiteAddAndSelection(environment)
  const canSelectAll = !disabled && form && withSelection && sites.length > 0
  const allSitesSelected = canSelectAll && sites.every((site) => site.selected)
  const someSitesSelected = canSelectAll && sites.some((site) => site.selected)

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
        </div>
      </div>
      {canSelectAll && (
        <FormControlLabel
          control={
            <Checkbox
              checked={allSitesSelected}
              indeterminate={someSitesSelected && !allSitesSelected}
              onChange={(_, checked) =>
                setValue(
                  'sites',
                  sites.map((site) => ({ ...site, selected: checked })),
                )
              }
              data-testid="organization-sites-select-all-checkbox"
            />
          }
          label={allSitesSelected ? tCommon('unselectAll') : tCommon('selectAll')}
        />
      )}
      <BaseTable table={table} className="mt1" testId="sites" />
      {canAddSite && (
        <div className="mt1 justify-end">
          <Button onClick={() => setValue('sites', [...sites, newSite()])} data-testid="add-site-button">
            {t('add')}
          </Button>
        </div>
      )}
      <GlossaryModal
        glossary={showGlossary ? 'title' : ''}
        onClose={() => setShowGlossary(false)}
        label="create-emission-factor"
        t={tGlossary}
      >
        {' '}
        {hasCustomGlossaryTextForEstablishment(environment) ? (
          <p>{tGlossary('informations')}</p>
        ) : (
          <>
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
          </>
        )}
      </GlossaryModal>
    </div>
  )
}

export default Sites
