'use client'

import { FormTextField } from '@/components/form/TextField'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { formatNumber } from '@/utils/number'
import { Environment, SiteCAUnit } from '@prisma/client'
import { ColumnDef } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Control, UseFormReturn } from 'react-hook-form'
import BCSites from '../../base/organization/Sites'
import styles from '../../base/organization/Sites.module.css'

interface Props<T extends SitesCommand> {
  form?: UseFormReturn<T>
  sites: SitesCommand['sites']
  withSelection?: boolean
  caUnit: SiteCAUnit
}

const Sites = <T extends SitesCommand>({ sites, form, withSelection, caUnit }: Props<T>) => {
  const t = useTranslations('organization.sites')
  const control = form?.control as Control<SitesCommand>
  const columns = useMemo(
    () =>
      [
        {
          id: 'volunteerNumber',
          header: t('volunteerNumber'),
          accessorKey: 'volunteerNumber',
          cell: ({ row, getValue }) =>
            form ? (
              <FormTextField
                data-testid="organization-sites-volunteer-number"
                type="number"
                className={styles.field}
                control={control}
                translation={t}
                name={`sites.${row.index}.volunteerNumber`}
                placeholder={t('volunteerNumberPlaceholder')}
                slotProps={{
                  htmlInput: { type: 'number', min: 0 },
                  input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                }}
                fullWidth
              />
            ) : (
              formatNumber(getValue<number>(), 2)
            ),
        },
        {
          id: 'beneficiaryNumber',
          header: t('beneficiaryNumber'),
          accessorKey: 'beneficiaryNumber',
          cell: ({ row, getValue }) =>
            form ? (
              <FormTextField
                data-testid="organization-sites-beneficiary-number"
                type="number"
                className={styles.field}
                control={control}
                translation={t}
                name={`sites.${row.index}.beneficiaryNumber`}
                placeholder={t('beneficiaryNumberPlaceholder')}
                slotProps={{
                  htmlInput: { type: 'number', min: 0 },
                  input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                }}
                fullWidth
              />
            ) : (
              formatNumber(getValue<number>(), 2)
            ),
        },
      ] as ColumnDef<SitesCommand['sites'][number]>[],
    [form],
  )

  return (
    <BCSites
      additionalColumns={columns}
      form={form}
      sites={sites}
      withSelection={withSelection}
      caUnit={caUnit}
      environment={Environment.TILT}
    />
  )
}

export default Sites
