'use client'

import Button from '@/components/base/Button'
import { FormCheckbox } from '@/components/form/Checkbox'
import { FormTextField } from '@/components/form/TextField'
import GlobalSites from '@/components/organization/Sites'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { CA_UNIT_VALUES, displayCA, formatNumber } from '@/utils/number'
import DeleteIcon from '@mui/icons-material/Delete'
import { SiteCAUnit } from '@prisma/client'
import { ColumnDef } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Control, UseFormGetValues, UseFormReturn, UseFormSetValue } from 'react-hook-form'

interface Props<T extends SitesCommand> {
  form?: UseFormReturn<T>
  sites: SitesCommand['sites']
  withSelection?: boolean
  caUnit: SiteCAUnit
}

const Sites = <T extends SitesCommand>({ sites, form, withSelection, caUnit }: Props<T>) => {
  const t = useTranslations('organization.sites')
  const tUnit = useTranslations('settings.caUnit')

  const control = form?.control as Control<SitesCommand>
  const setValue = form?.setValue as UseFormSetValue<SitesCommand>
  const getValues = form?.getValues as UseFormGetValues<SitesCommand>

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
                <div className="align-center">
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
                  placeholder={t('namePlaceholder')}
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
              placeholder={t('etpPlaceholder')}
              slotProps={{
                htmlInput: { type: 'number', min: 0 },
                input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
              }}
            />
          ) : (
            formatNumber(getValue<number>(), 2)
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
              placeholder={t('caPlaceholder', { unit: headerCAUnit })}
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
          <div className="w100 flex-cc">
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

  return <GlobalSites sites={sites} columns={columns} form={form} withSelection={withSelection} caUnit={caUnit} />
}

export default Sites
