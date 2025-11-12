'use client'

import DebouncedInput from '@/components/base/DebouncedInput'
import { TableActionButton } from '@/components/base/TableActionButton'
import { FormCheckbox } from '@/components/form/Checkbox'
import { FormTextField } from '@/components/form/TextField'
import GlobalSites from '@/components/organization/Sites'
import { getCncByCncCode } from '@/services/serverFunctions/study'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { Environment } from '@prisma/client'
import { ColumnDef } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useRef } from 'react'
import { Control, Controller, UseFormGetValues, UseFormReturn, UseFormSetValue } from 'react-hook-form'

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

  // Track original site data to detect manual changes
  const originalSiteDataRef = useRef<
    Record<number, { cncCode: string; name: string; postalCode: string; city: string; cncId: string }>
  >({})

  const setCncData = useCallback(
    async (cncCode: string, index: number) => {
      // Initialize original values if not set
      if (!(index in originalSiteDataRef.current)) {
        const currentSite = sites[index]
        originalSiteDataRef.current[index] = {
          cncCode: currentSite?.cncCode || '',
          name: currentSite?.name || '',
          postalCode: currentSite?.postalCode || '',
          city: currentSite?.city || '',
          cncId: currentSite?.cncId || '',
        }
      }

      const originalData = originalSiteDataRef.current[index]

      // If going back to original value, restore original site data
      if (cncCode === originalData.cncCode) {
        setValue(`sites.${index}.cncId`, originalData.cncId)
        setValue(`sites.${index}.name`, originalData.name)
        setValue(`sites.${index}.postalCode`, originalData.postalCode)
        setValue(`sites.${index}.city`, originalData.city)
        setValue(`sites.${index}.cncCode`, originalData.cncCode)
        return
      }

      if (!cncCode || cncCode.length < 1) {
        // Clear all fields if input is too short
        setValue(`sites.${index}.cncId`, '')
        setValue(`sites.${index}.name`, '')
        setValue(`sites.${index}.postalCode`, '')
        setValue(`sites.${index}.city`, '')
        return
      }
      // Look up CNC by cncCode (what the user enters)
      const response = await getCncByCncCode(cncCode)
      if (!response.success || !response.data) {
        // Clear all fields if CNC lookup fails
        setValue(`sites.${index}.cncId`, '')
        setValue(`sites.${index}.name`, '')
        setValue(`sites.${index}.postalCode`, '')
        setValue(`sites.${index}.city`, '')
        return
      }
      const cnc = response.data
      // Store the CNC's id (UUID) in the cncId field, not the cncCode
      if (cnc.id) {
        setValue(`sites.${index}.cncId`, cnc.id)
      }
      // Store the cnc cncCode for display purposes only
      if (cnc.cncCode) {
        setValue(`sites.${index}.cncCode`, cnc.cncCode)
      }
      if (cnc.nom) {
        setValue(`sites.${index}.name`, cnc.nom)
      }
      if (cnc.codeInsee) {
        setValue(`sites.${index}.postalCode`, cnc.codeInsee)
      }
      if (cnc.commune) {
        setValue(`sites.${index}.city`, cnc.commune)
      }
    },
    [setValue, sites],
  )

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
                  {row.original.cncCode || getValue<string>() || ''}
                </div>
              ) : (
                <Controller
                  name={`sites.${row.index}.cncId`}
                  control={control}
                  render={() => {
                    const displayValue = row.original.cncCode || ''

                    return (
                      <DebouncedInput
                        data-testid="edit-site-cnc"
                        debounce={200}
                        value={displayValue}
                        onChange={(newValue: string) => {
                          setCncData(newValue, row.index)
                        }}
                        placeholder={t('cncPlaceholder')}
                        size="small"
                        fullWidth
                      />
                    )
                  }}
                />
              )}
            </>
          ) : (
            getValue<string>()
          ),
      },
      {
        id: 'name',
        header: t('namePlaceholder'),
        accessorKey: 'name',
        cell: ({ row, getValue }) =>
          row.original.cncId && form ? (
            <>
              {withSelection ? (
                <div className="align-center">{getValue<string>()}</div>
              ) : (
                <FormTextField
                  data-testid="edit-site-name"
                  control={control}
                  name={`sites.${row.index}.name`}
                  placeholder={t('namePlaceholder')}
                  size="small"
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
                  control={control}
                  name={`sites.${row.index}.postalCode`}
                  placeholder={t('postalCodePlaceholder')}
                  size="small"
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
                  control={control}
                  name={`sites.${row.index}.city`}
                  placeholder={t('cityPlaceholder')}
                  size="small"
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
        id: 'actions',
        header: '',
        accessorKey: 'id',
        cell: ({ getValue }) => (
          <TableActionButton
            type="delete"
            size="medium"
            data-testid="delete-site-button"
            onClick={() => {
              const id = getValue<string>()
              setValue(
                'sites',
                getValues('sites').filter((site) => site.id !== id),
              )
            }}
          />
        ),
      })
    }
    return columns
  }, [t, form, withSelection, control, setCncData, setValue, getValues])

  return (
    <GlobalSites
      sites={sites}
      columns={columns}
      form={form}
      withSelection={withSelection}
      environment={Environment.CUT}
    />
  )
}

export default Sites
