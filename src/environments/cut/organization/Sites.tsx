'use client'

import { TableActionButton } from '@/components/base/TableActionButton'
import { FormCheckbox } from '@/components/form/Checkbox'
import { FormTextField } from '@/components/form/TextField'
import GlobalSites from '@/components/organization/Sites'
import EnvironmentLoader from '@/environments/core/utils/EnvironmentLoader'
import { useServerFunction } from '@/hooks/useServerFunction'
import { getAllCNCs } from '@/services/serverFunctions/cnc'
import { SitesCommand } from '@/services/serverFunctions/study.command'
import { Autocomplete, TextField } from '@mui/material'
import { Cnc, Environment } from '@prisma/client'
import { ColumnDef } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'

interface Props {
  form: UseFormReturn<SitesCommand>
  sites: SitesCommand['sites']
  withSelection?: boolean
}

const Sites = ({ sites, form, withSelection }: Props) => {
  const t = useTranslations('organization.sites')
  const { callServerFunction } = useServerFunction()
  const [cncs, setCNCs] = useState<Cnc[] | null>(null)

  useEffect(() => {
    const fetchCNCs = async () => {
      const response = await callServerFunction(async () => {
        const data = await getAllCNCs()
        return { success: true, data }
      })

      if (response.success) {
        setCNCs(response.data)
      } else {
        setCNCs([])
      }
    }

    if (cncs === null) {
      fetchCNCs()
    }
  }, [callServerFunction, cncs])

  // Track original site data to detect manual changes
  const originalSiteDataRef = useRef<
    Record<number, { cncCode: string; name: string; postalCode: string; city: string; cncId: string }>
  >({})

  const setCncData = useCallback(
    (cnc: Cnc | null, index: number) => {
      const { setValue, getValues } = form
      const sites = getValues('sites')

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

      if (!cnc) {
        setValue(`sites.${index}.cncId`, '')
        setValue(`sites.${index}.name`, '')
        setValue(`sites.${index}.postalCode`, '')
        setValue(`sites.${index}.city`, '')
        setValue(`sites.${index}.cncCode`, '')
        return
      }

      // If going back to original value, restore original site data
      if (cnc.cncCode === originalData.cncCode) {
        setValue(`sites.${index}.cncId`, originalData.cncId)
        setValue(`sites.${index}.name`, originalData.name)
        setValue(`sites.${index}.postalCode`, originalData.postalCode)
        setValue(`sites.${index}.city`, originalData.city)
        setValue(`sites.${index}.cncCode`, originalData.cncCode)
        return
      }

      setValue(`sites.${index}.cncId`, cnc.id || '')
      setValue(`sites.${index}.cncCode`, cnc.cncCode || '')
      setValue(`sites.${index}.name`, cnc.nom || '')
      setValue(`sites.${index}.postalCode`, cnc.codeInsee || '')
      setValue(`sites.${index}.city`, cnc.commune || '')
    },
    [form],
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
                    control={form.control}
                    translation={t}
                    name={`sites.${row.index}.selected`}
                    data-testid="organization-sites-checkbox"
                  />
                  {row.original.cncCode || getValue<string>() || ''}
                </div>
              ) : (
                <Controller
                  name={`sites.${row.index}.cncCode`}
                  control={form.control}
                  defaultValue=""
                  render={({ field }) => {
                    const selectedCnc = cncs?.find((cnc) => cnc.cncCode === field.value)
                    return (
                      <Autocomplete
                        data-testid="edit-site-cnc"
                        freeSolo
                        options={cncs ?? []}
                        value={selectedCnc || null}
                        inputValue={field.value || ''}
                        onChange={(_, newValue) => {
                          if (typeof newValue === 'string') {
                            if (!newValue) {
                              setCncData(null, row.index)
                            } else {
                              field.onChange(newValue)
                            }
                          } else {
                            setCncData(newValue, row.index)
                          }
                        }}
                        onInputChange={(_, newInputValue, reason) => {
                          if (reason === 'input') {
                            if (!newInputValue) {
                              setCncData(null, row.index)
                            } else {
                              field.onChange(newInputValue)
                            }
                          }
                        }}
                        getOptionLabel={(option) => {
                          if (typeof option === 'string') {
                            return option
                          }
                          return option.cncCode || ''
                        }}
                        renderOption={(props, option) => (
                          <li {...props} key={option.id}>
                            {`${option.cncCode} - ${option.nom} (${option.dep})`}
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField {...params} placeholder={t('cncPlaceholder')} size="small" />
                        )}
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
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
              form.setValue(
                'sites',
                form.getValues('sites').filter((site) => site.id !== id),
              )
            }}
          />
        ),
      })
    }
    return columns
  }, [t, form, withSelection, cncs, setCncData])

  if (cncs === null) {
    return <EnvironmentLoader />
  }

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
