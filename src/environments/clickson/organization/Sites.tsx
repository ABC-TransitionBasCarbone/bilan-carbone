'use client'

import LinkButton from '@/components/base/LinkButton'
import { FormCheckbox } from '@/components/form/Checkbox'
import { FormTextField } from '@/components/form/TextField'
import GlobalSites from '@/components/organization/Sites'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { formatNumber } from '@/utils/number'
import EditIcon from '@mui/icons-material/Edit'
import { Environment } from '@prisma/client'
import { ColumnDef } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Control, UseFormReturn } from 'react-hook-form'

interface Props<T extends SitesCommand> {
  form?: UseFormReturn<T>
  sites: SitesCommand['sites']
  withSelection?: boolean
  organizationId?: string
}

const Sites = <T extends SitesCommand>({ sites, form, withSelection, organizationId }: Props<T>) => {
  const t = useTranslations('organization.sites')
  const control = form?.control as Control<SitesCommand>
  const columns = useMemo(
    () =>
      [
        {
          id: 'name',
          header: () => (
            <div className="align-center gapped">
              {t('name')}
              {form && withSelection && organizationId && (
                <LinkButton
                  href={`/organisations/${organizationId}/modifier`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <EditIcon />
                </LinkButton>
              )}
            </div>
          ),
          accessorKey: 'name',
          cell: ({ row, getValue }) =>
            form ? (
              <>
                {withSelection ? (
                  <div className="align-center">
                    <FormCheckbox
                      size="small"
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
                    size="small"
                    control={control}
                    name={`sites.${row.index}.name`}
                    placeholder={t('namePlaceholder')}
                    fullWidth
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
                data-testid="organization-sites-volunteer-number"
                type="number"
                control={control}
                name={`sites.${row.index}.etp`}
                placeholder={t('etpPlaceholder')}
                slotProps={{
                  htmlInput: { type: 'number', min: 0 },
                  input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                }}
                fullWidth
                size="small"
              />
            ) : (
              formatNumber(getValue<number>(), 2)
            ),
        },
        {
          id: 'studentNumber',
          header: t('studentNumber'),
          accessorKey: 'studentNumber',
          cell: ({ row, getValue }) =>
            form ? (
              <FormTextField
                data-testid="organization-sites-beneficiary-number"
                type="number"
                control={control}
                name={`sites.${row.index}.studentNumber`}
                placeholder={t('studentNumberPlaceholder')}
                slotProps={{
                  htmlInput: { type: 'number', min: 0 },
                  input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                }}
                fullWidth
                size="small"
              />
            ) : (
              formatNumber(getValue<number>(), 2)
            ),
        },
        {
          id: 'establishmentYear',
          header: t('establishmentYear'),
          accessorKey: 'establishmentYear',
          cell: ({ row, getValue }) =>
            form ? (
              <FormTextField
                data-testid="organization-sites-establishmentYear"
                control={control}
                name={`sites.${row.index}.establishmentYear`}
                placeholder={t('establishmentYearPlaceholder')}
                size="small"
              />
            ) : (
              getValue<string>()
            ),
        },
      ] as ColumnDef<SitesCommand['sites'][number]>[],
    [form],
  )

  return (
    <GlobalSites
      sites={sites}
      columns={columns}
      form={form}
      withSelection={withSelection}
      environment={Environment.CLICKSON}
    />
  )
}

export default Sites
