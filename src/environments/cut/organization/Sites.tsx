'use client'

import Button from '@/components/base/Button'
import DebouncedInput from '@/components/base/DebouncedInput'
import { FormCheckbox } from '@/components/form/Checkbox'
import { FormTextField } from '@/components/form/TextField'
import GlobalSites from '@/components/organization/Sites'
import { getCNCCodeById } from '@/services/serverFunctions/study'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import DeleteIcon from '@mui/icons-material/Delete'
import { ColumnDef } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { Control, Controller, UseFormGetValues, UseFormReturn, UseFormSetValue } from 'react-hook-form'
import styles from '../../base/organization/Sites.module.css'

interface Props<T extends SitesCommand> {
  form?: UseFormReturn<T>
  sites: SitesCommand['sites']
  withSelection?: boolean
}

const Sites = <T extends SitesCommand>({ sites, form, withSelection }: Props<T>) => {
  const t = useTranslations('organization.sites')

  const control = form?.control as Control<SitesCommand>
  const setValue = form?.setValue as UseFormSetValue<SitesCommand>
  const getValues = form?.getValues as UseFormGetValues<SitesCommand>

  const getCncData = async (cncId: string, index: number) => {
    if (!cncId || cncId.length < 2) {
      return
    }
    const cnc = await getCNCCodeById(cncId)
    if (!cnc) {
      return
    }
    cnc.nom && setValue(`sites.${index}.name`, cnc.nom)
    cnc.codeInsee && setValue(`sites.${index}.postalCode`, cnc.codeInsee)
    cnc.commune && setValue(`sites.${index}.city`, cnc.commune)
  }

  const columns = useMemo(() => {
    const columns = [
      {
        id: 'cncId',
        header: t('cnc'),
        accessorKey: 'cncId',
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
                <Controller
                  name={`sites.${row.index}.cncId`}
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <DebouncedInput
                      data-testid="edit-site-cnc"
                      className={styles.cnc}
                      debounce={200}
                      value={value ?? ''}
                      onChange={(newValue: string) => {
                        onChange(newValue)
                        newValue && getCncData(newValue, row.index)
                      }}
                      placeholder={t('cncPlaceholder')}
                    />
                  )}
                />
              )}
            </>
          ) : (
            getValue<string>()
          ),
      },
      {
        id: 'name',
        header: t('name'),
        accessorKey: 'name',
        cell: ({ row, getValue }) =>
          row.original.cncId && form ? (
            <>
              {withSelection ? (
                <div className="align-center">{getValue<string>()}</div>
              ) : (
                <FormTextField
                  data-testid="edit-site-name"
                  className={styles.field}
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
        id: 'postalCode',
        header: t('postalCode'),
        accessorKey: 'postalCode',
        cell: ({ row, getValue }) =>
          row.original.cncId && form ? (
            <>
              {withSelection ? (
                <div className="align-center">{getValue<string>()}</div>
              ) : (
                <FormTextField
                  data-testid="organization-sites-postal-code"
                  className={styles.field}
                  control={control}
                  translation={t}
                  name={`sites.${row.index}.postalCode`}
                  placeholder={t('postalCodePlaceholder')}
                />
              )}
            </>
          ) : (
            getValue<string>()
          ),
      },
      {
        id: 'city',
        header: t('city'),
        accessorKey: 'city',
        cell: ({ row, getValue }) =>
          row.original.cncId && form ? (
            <>
              {withSelection ? (
                <div className="align-center">{getValue<string>()}</div>
              ) : (
                <FormTextField
                  data-testid="organization-sites-city"
                  className={styles.field}
                  control={control}
                  translation={t}
                  name={`sites.${row.index}.city`}
                  placeholder={t('cityPlaceholder')}
                />
              )}
            </>
          ) : (
            getValue<string>()
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
  }, [t, form])

  return <GlobalSites sites={sites} columns={columns} form={form} withSelection={withSelection} isCut={true} />
}

export default Sites
