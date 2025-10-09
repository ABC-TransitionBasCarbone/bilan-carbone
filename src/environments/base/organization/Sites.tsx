'use client'

import Button from '@/components/base/Button'
import { FormCheckbox } from '@/components/form/Checkbox'
import { FormTextField } from '@/components/form/TextField'
import GlobalSites from '@/components/organization/Sites'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { CA_UNIT_VALUES, displayCA, formatNumber } from '@/utils/number'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import { Environment, SiteCAUnit } from '@prisma/client'
import { ColumnDef } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Control, UseFormGetValues, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import styles from './Sites.module.css'

interface Props<T extends SitesCommand> {
  form?: UseFormReturn<T>
  sites: SitesCommand['sites']
  withSelection?: boolean
  caUnit: SiteCAUnit
  additionalColumns?: ColumnDef<SitesCommand['sites'][number]>[]
  environment?: Environment
  onDuplicate?: (studySiteId: string) => void
}

const Sites = <T extends SitesCommand>({
  sites,
  form,
  withSelection,
  caUnit,
  additionalColumns = [],
  environment = Environment.BC,
  onDuplicate,
}: Props<T>) => {
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
                  className={styles.field}
                  control={control}
                  translation={t}
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
              className={styles.field}
              control={control}
              translation={t}
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
              type="number"
              className={styles.field}
              control={control}
              translation={t}
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

    if (!form && onDuplicate) {
      columns.push({
        id: 'duplicate',
        header: t('actions'),
        accessorKey: 'id',
        cell: ({ getValue }) => (
          <div className="w100">
            <Button
              data-testid="duplicate-site-button"
              aria-label={t('duplicate')}
              variant="outlined"
              onClick={() => {
                const id = getValue<string>()
                onDuplicate(id)
              }}
            >
              <ContentCopyIcon />
            </Button>
          </div>
        ),
      })
    }

    return columns
    // TODO: This component needs refactoring because the form is not properly defined
    // Without removing some deps the form refreshes on every keystroke
  }, [t, form, caUnit, onDuplicate])

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
