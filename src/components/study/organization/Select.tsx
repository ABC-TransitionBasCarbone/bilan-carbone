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
import { getUserSettings } from '@/services/serverFunctions/user'
import { CUT } from '@/store/AppEnvironment'
import { CA_UNIT_VALUES, defaultCAUnit, displayCA } from '@/utils/number'
import { FormHelperText, MenuItem } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface Props {
  organizationVersions: OrganizationWithSites[]
  selectOrganizationVersion: Dispatch<SetStateAction<OrganizationWithSites | undefined>>
  form: UseFormReturn<CreateStudyCommand>
}

const SelectOrganization = ({ organizationVersions, selectOrganizationVersion, form }: Props) => {
  const t = useTranslations('study.organization')
  const [error, setError] = useState('')
  const [caUnit, setCAUnit] = useState(defaultCAUnit)
  const sites = form.watch('sites')
  const organizationVersionId = form.watch('organizationVersionId')

  const organizationVersion = useMemo(
    () => organizationVersions.find((organizationVersion) => organizationVersion.id === organizationVersionId),
    [organizationVersionId, organizationVersions],
  )

  useEffect(() => {
    applyUserSettings()
  }, [])

  useEffect(() => {
    if (organizationVersion) {
      form.setValue(
        'sites',
        organizationVersion.organization.sites.map((site) => ({
          ...site,
          ca: site.ca ? displayCA(site.ca, caUnit) : 0,
          selected: false,
          postalCode: site.postalCode ?? '',
          city: site.city ?? '',
        })),
      )
    } else {
      form.setValue('sites', [])
    }
  }, [organizationVersion, caUnit])

  const applyUserSettings = async () => {
    const caUnit = (await getUserSettings())?.caUnit
    if (caUnit !== undefined) {
      setCAUnit(CA_UNIT_VALUES[caUnit])
    }
  }

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
              environmentComponents={{ [CUT]: <SitesCut sites={sites} form={form} withSelection /> }}
              defaultComponent={<Sites sites={sites} form={form} withSelection />}
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
            <LinkButton href={`/organisations/${organizationVersion.id}/modifier`}>{t('addSite')}</LinkButton>
          </>
        ))}
    </Block>
  )
}

export default SelectOrganization
