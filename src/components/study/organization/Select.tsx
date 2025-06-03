'use client'
import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import LinkButton from '@/components/base/LinkButton'
import { FormSelect } from '@/components/form/Select'
import { OrganizationWithSites } from '@/db/account'
import Sites from '@/environments/base/organization/Sites'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import SitesCut from '@/environments/cut/organization/Sites'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { CA_UNIT_VALUES, displayCA } from '@/utils/number'
import { FormHelperText, MenuItem } from '@mui/material'
import { Environment, SiteCAUnit } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface Props {
  user: UserSession
  organizationVersions: OrganizationWithSites[]
  selectOrganizationVersion: Dispatch<SetStateAction<OrganizationWithSites | undefined>>
  form: UseFormReturn<CreateStudyCommand>
  caUnit: SiteCAUnit
}

const SelectOrganization = ({ user, organizationVersions, selectOrganizationVersion, form, caUnit }: Props) => {
  const t = useTranslations('study.organization')
  const [error, setError] = useState('')
  const sites = form.watch('sites')
  const organizationVersionId = form.watch('organizationVersionId')

  const organizationVersion = useMemo(
    () => organizationVersions.find((organizationVersion) => organizationVersion.id === organizationVersionId),
    [organizationVersionId, organizationVersions],
  )

  useEffect(() => {
    if (!organizationVersion) {
      form.setValue('sites', [])
    } else {
      const newSites = organizationVersion.organization.sites.map((site) => site.id)
      if (JSON.stringify(form.getValues('sites').map((site) => site.id)) !== JSON.stringify(newSites)) {
        form.setValue(
          'sites',
          organizationVersion.organization.sites.map((site) => ({
            ...site,
            ca: site.ca ? displayCA(site.ca, CA_UNIT_VALUES[caUnit]) : 0,
            selected: false,
            postalCode: site.postalCode ?? '',
            city: site.city ?? '',
          })),
        )
      }
    }
  }, [organizationVersion, caUnit])

  const next = () => {
    if (!sites.some((site) => site.selected)) {
      setError(t('validation.sites'))
    } else {
      if (
        user.environment === Environment.CUT &&
        sites
          .filter((site) => site.selected)
          .some(
            (site) =>
              Number.isNaN(site.etp) ||
              (site?.etp && site?.etp <= 0) ||
              Number.isNaN(site.ca) ||
              (site?.ca && site?.ca <= 0),
          )
      ) {
        setError(t('validation.etpCa'))
      } else {
        selectOrganizationVersion(organizationVersion)
      }
    }
  }

  return (
    <Block title={t('title')} as="h1" data-testid="new-study-organization-title">
      {organizationVersions.length === 1 ? (
        <p className="title-h2">{organizationVersions[0].organization.name}</p>
      ) : (
        <FormSelect
          data-testid="new-study-organization-select"
          name="organizationVersionId"
          control={form.control}
          translation={t}
          label={t('select')}
        >
          {organizationVersions.map((organizationVersion) => (
            <MenuItem key={organizationVersion.id} value={organizationVersion.id}>
              {organizationVersion.organization.name}
            </MenuItem>
          ))}
        </FormSelect>
      )}
      {organizationVersion &&
        (organizationVersion.organization.sites.length > 0 ? (
          <>
            <DynamicComponent
              environmentComponents={{
                [Environment.CUT]: <SitesCut sites={sites} form={form} caUnit={caUnit} withSelection />,
              }}
              defaultComponent={<Sites sites={sites} form={form} caUnit={caUnit} withSelection />}
            />
            <div className="mt2">
              <Button
                disabled={!sites.some((site) => site.selected)}
                data-testid="new-study-organization-button"
                onClick={next}
              >
                {t('next')}
              </Button>
              {error && <FormHelperText error>{error}</FormHelperText>}
            </div>
          </>
        ) : (
          <>
            <p className="title-h3 mt1 mb-2">{t('noSites')}</p>
            <LinkButton href={`/organisations/${organizationVersion.id}/modifier`}>{t('addSite')}</LinkButton>
          </>
        ))}
    </Block>
  )
}

export default SelectOrganization
