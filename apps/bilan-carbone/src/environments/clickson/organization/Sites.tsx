'use client'

import LinkButton from '@/components/base/LinkButton'
import { FormCheckbox } from '@/components/form/Checkbox'
import { FormSelect } from '@/components/form/Select'
import GlobalSites from '@/components/organization/Sites'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { formatNumber } from '@/utils/number'
import EditIcon from '@mui/icons-material/Edit'
import { MenuItem } from '@mui/material'
import { FormTextField } from '@repo/components/src/form/TextField'
import { Environment, EstablishmentType } from '@repo/db-common/enums'
import { ColumnDef } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Control, UseFormReturn } from 'react-hook-form'
import styles from './Sites.module.css'

interface Props<T extends SitesCommand> {
  form?: UseFormReturn<T>
  sites: SitesCommand['sites']
  withSelection?: boolean
  organizationId?: string
  disabled?: boolean
}

const Sites = <T extends SitesCommand>({ sites, form, withSelection, organizationId, disabled = false }: Props<T>) => {
  const t = useTranslations('organization.sites')
  const control = form?.control as Control<SitesCommand>
  const columns = useMemo(
    () =>
      [
        {
          id: 'establishmentType',
          header: t('establishmentType.title'),
          accessorKey: 'establishmentType',
          cell: ({ row, getValue }) =>
            !disabled && form ? (
              <FormSelect
                translation={t}
                data-testid="organization-sites-volunteer-number"
                type="string"
                control={control}
                name={`sites.${row.index}.establishmentType`}
                fullWidth
                className={styles.select}
              >
                {Object.values(EstablishmentType).map((establishmentType) => (
                  <MenuItem key={establishmentType} value={establishmentType}>
                    {t(`establishmentType.${establishmentType}`)}
                  </MenuItem>
                ))}
              </FormSelect>
            ) : (
              formatNumber(getValue<number>(), 2)
            ),
        },
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
            !disabled && form ? (
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
            !disabled && form ? (
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
            !disabled && form ? (
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
            !disabled && form ? (
              <FormTextField
                data-testid="organization-sites-beneficiary-number"
                type="number"
                control={control}
                name={`sites.${row.index}.establishmentYear`}
                placeholder={t('establishmentYearPlaceholder')}
                slotProps={{
                  htmlInput: { type: 'number', min: 0 },
                  input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                }}
                fullWidth
                size="small"
              />
            ) : (
              getValue<number>()
            ),
        },
        {
          id: 'city',
          header: t('city'),
          accessorKey: 'city',
          cell: ({ row, getValue }) =>
            !disabled && form ? (
              <FormTextField
                data-testid="organization-sites-city"
                control={control}
                name={`sites.${row.index}.city`}
                placeholder={t('cityPlaceholder')}
                size="small"
              />
            ) : (
              getValue<string>()
            ),
        },
        {
          id: 'academy',
          header: t('academy'),
          accessorKey: 'academy',
          cell: ({ row, getValue }) =>
            !disabled && form ? (
              <FormTextField
                data-testid="organization-sites-academy"
                control={control}
                name={`sites.${row.index}.academy`}
                placeholder={t('academyPlaceholder')}
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
