'use client'

import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import LinkButton from '@/components/base/LinkButton'
import { FormSelect } from '@/components/form/Select'
import { OrganizationWithSites } from '@/db/user'
import { CreateStudyCommand, SitesCommand, SitesCommandValidation } from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormHelperText, MenuItem } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { useForm, UseFormReturn, useWatch } from 'react-hook-form'
import Sites from './Sites'

interface Props {
  organizations: OrganizationWithSites[]
  selectOrganization: Dispatch<SetStateAction<OrganizationWithSites | undefined>>
  form: UseFormReturn<CreateStudyCommand>
}

const SelectOrganization = ({ organizations, selectOrganization, form }: Props) => {
  const t = useTranslations('study.organization')
  const [error, setError] = useState('')
  const sites = form.watch('sites')
  const organizationId = form.watch('organizationId')

  const sitesForm = useForm<SitesCommand>({
    resolver: zodResolver(SitesCommandValidation),
    defaultValues: {
      sites,
    },
  })

  const currentSites = useWatch({
    control: sitesForm.control,
    name: 'sites',
  })

  useEffect(() => {
    form.setValue('sites', currentSites)
  }, [currentSites, form])

  const organization = useMemo(
    () => organizations.find((organization) => organization.id === organizationId),
    [organizationId, organizations],
  )

  useEffect(() => {
    if (organization) {
      form.setValue(
        'sites',
        organization.sites.map((site) => ({ ...site, selected: false })),
      )
    } else {
      form.setValue('sites', [])
    }
  }, [organization])

  return (
    <Block title={t('title')} as="h1" data-testid="new-study-organization-title">
      {organizations.length === 1 ? (
        <p className="title-h2">{organizations[0].name}</p>
      ) : (
        <FormSelect
          data-testid="new-study-organization-select"
          name="organizationId"
          control={form.control}
          translation={t}
          label={t('select')}
        >
          {organizations.map((organization) => (
            <MenuItem key={organization.id} value={organization.id}>
              {organization.name}
            </MenuItem>
          ))}
        </FormSelect>
      )}
      {organization &&
        (organization.sites.length > 0 ? (
          <>
            <Sites form={sitesForm} sites={sites} />
            <div className="mt2">
              <Button
                data-testid="new-study-organization-button"
                onClick={() => {
                  if (sites.some((site) => site.selected)) {
                    selectOrganization(organization)
                  } else {
                    setError(t('validation.sites'))
                  }
                }}
              >
                {t('next')}
              </Button>
              {error && <FormHelperText error>{error}</FormHelperText>}
            </div>
          </>
        ) : (
          <>
            <p className="title-h3 mt1 mb-2">{t('noSites')}</p>
            <LinkButton href={`/organisations/${organization.id}/modifier`}>{t('addSite')}</LinkButton>
          </>
        ))}
    </Block>
  )
}

export default SelectOrganization
