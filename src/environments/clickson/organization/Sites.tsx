'use client'

import LinkButton from '@/components/base/LinkButton'
import { TableActionButton } from '@/components/base/TableActionButton'
import { FormCheckbox } from '@/components/form/Checkbox'
import { FormTextField } from '@/components/form/TextField'
import GlobalSites from '@/components/organization/Sites'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { CA_UNIT_VALUES, displayCA, formatNumber } from '@/utils/number'
import EditIcon from '@mui/icons-material/Edit'
import { Environment, SiteCAUnit } from '@prisma/client'
import { ColumnDef } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Control, UseFormGetValues, UseFormReturn, UseFormSetValue } from 'react-hook-form'

interface Props<T extends SitesCommand> {
  form?: UseFormReturn<T>
  sites: SitesCommand['sites']
  withSelection?: boolean
  caUnit: SiteCAUnit
  additionalColumns?: ColumnDef<SitesCommand['sites'][number]>[]
  environment?: Environment
  organizationId?: string
  onDuplicate?: (studySiteId: string) => void
}

const Sites = <T extends SitesCommand>({
  sites,
  form,
  withSelection,
  caUnit,
  additionalColumns = [],
  environment = Environment.BC,
  organizationId,
  onDuplicate,
}: Props<T>) => {
  const t = useTranslations('organization.sites')
  const tUnit = useTranslations('settings.caUnit')

  const control = form?.control as Control<SitesCommand>
  const setValue = form?.setValue as UseFormSetValue<SitesCommand>
  const getValues = form?.getValues as UseFormGetValues<SitesCommand>

  const headerCAUnit = useMemo(() => tUnit(caUnit), [caUnit, tUnit])

  const selectedSites = sites.filter((site) => site.selected)

  const columns = useMemo(() => {
    const columns = [
      {
        id: 'name',
        header: () => (
          <div className="align-center gapped">
            {t('name')}
            {form && withSelection && organizationId && (
              <LinkButton href={`/organisations/${organizationId}/modifier`} target="_blank" rel="noreferrer noopener">
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
                    disabled={!sites[row.index]?.selected && selectedSites.length > 0}
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
              data-testid="organization-sites-etp"
              type="number"
              size="small"
              control={control}
              name={`sites.${row.index}.etp`}
              placeholder={t('etpPlaceholder')}
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
        id: 'ca',
        header: t('ca', { unit: headerCAUnit }),
        accessorKey: 'ca',
        cell: ({ row, getValue }) =>
          form ? (
            <FormTextField
              data-testid="organization-sites-ca"
              size="small"
              type="number"
              control={control}
              name={`sites.${row.index}.ca`}
              placeholder={t('caPlaceholder', { unit: headerCAUnit })}
              slotProps={{
                htmlInput: { type: 'number', min: 0 },
                input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
              }}
              fullWidth
            />
          ) : (
            `${formatNumber(displayCA(getValue<number>(), CA_UNIT_VALUES[caUnit]))}`
          ),
      },
      ...additionalColumns,
    ] as ColumnDef<SitesCommand['sites'][0]>[]

    if ((form && !withSelection) || (!form && onDuplicate)) {
      columns.push({
        id: 'actions',
        header: '',
        accessorKey: 'id',
        cell: ({ getValue }) => (
          <>
            {form && !withSelection && (
              <TableActionButton
                type="delete"
                onClick={() => {
                  const id = getValue<string>()
                  setValue(
                    'sites',
                    getValues('sites').filter((site) => site.id !== id),
                  )
                }}
                data-testid="delete-site-button"
              />
            )}
            {!form && onDuplicate && (
              <TableActionButton
                type="duplicate"
                onClick={() => {
                  const id = getValue<string>()
                  onDuplicate(id)
                }}
                data-testid="duplicate-site-button"
              />
            )}
          </>
        ),
      })
    }

    return columns
    // TODO: This component needs refactoring because the form is not properly defined
    // Without removing some deps the form refreshes on every keystroke
  }, [t, form, caUnit, onDuplicate, selectedSites])

  return (
    <GlobalSites
      sites={sites}
      columns={columns}
      form={form}
      withSelection={withSelection}
      caUnit={caUnit}
      environment={environment}
    />
  )
}

export default Sites
