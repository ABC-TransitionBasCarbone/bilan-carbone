'use client'
import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import LinkButton from '@/components/base/LinkButton'
import { FormSelect } from '@/components/form/Select'
import { OrganizationWithSites } from '@/db/user'
import Sites from '@/environments/base/organization/Sites'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import SitesCut from '@/environments/cut/organization/Sites'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { CUT } from '@/store/AppEnvironment'
import { CA_UNIT_VALUES, displayCA } from '@/utils/number'
import { FormHelperText, MenuItem } from '@mui/material'
import { SiteCAUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface Props {
  organizations: OrganizationWithSites[]
  selectOrganization: Dispatch<SetStateAction<OrganizationWithSites | undefined>>
  form: UseFormReturn<CreateStudyCommand>
  caUnit: SiteCAUnit
}

const SelectOrganization = ({ organizations, selectOrganization, form, caUnit }: Props) => {
  const t = useTranslations('study.organization')
  const [error, setError] = useState('')
  const sites = form.watch('sites')
  const organizationId = form.watch('organizationId')

  const organization = useMemo(
    () => organizations.find((organization) => organization.id === organizationId),
    [organizationId, organizations],
  )

  useEffect(() => {
    if (organization) {
      form.setValue(
        'sites',
        organization.sites.map((site) => ({
          ...site,
          ca: site.ca ? displayCA(site.ca, CA_UNIT_VALUES[caUnit]) : 0,
          selected: false,
          postalCode: site.postalCode ?? '',
          city: site.city ?? '',
        })),
      )
    } else {
      form.setValue('sites', [])
    }
  }, [organization, caUnit])

  const next = () => {
    if (!sites.some((site) => site.selected)) {
      setError(t('validation.sites'))
    } else {
      if (
        sites
          .filter((site) => site.selected)
          .some((site) => Number.isNaN(site.etp) || site.etp <= 0 || Number.isNaN(site.ca) || site.ca <= 0)
      ) {
        setError(t('validation.etpCa'))
      } else {
        selectOrganization(organization)
      }
    }
  }

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
            <DynamicComponent
              environmentComponents={{ [CUT]: <SitesCut sites={sites} form={form} caUnit={caUnit} withSelection /> }}
              defaultComponent={<Sites sites={sites} form={form} caUnit={caUnit} withSelection />}
            />
            <div className="mt2">
              <Button data-testid="new-study-organization-button" onClick={next}>
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
