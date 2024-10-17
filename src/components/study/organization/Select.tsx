'use client'

import Button from '@/components/base/Button'
import { OrganizationWithSites } from '@/db/user'
import { MenuItem, Select } from '@mui/material'
import { useTranslations } from 'next-intl'
import React, { Dispatch, SetStateAction, useMemo, useState } from 'react'

interface Props {
  organizations: OrganizationWithSites[]
  selectOrganization: Dispatch<SetStateAction<OrganizationWithSites | undefined>>
}

const SelectOrganization = ({ organizations, selectOrganization }: Props) => {
  const t = useTranslations('study.organization')
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || '')

  const organization = useMemo(
    () => organizations.find((organization) => organization.id === organizationId),
    [organizationId, organizations],
  )

  return (
    <>
      <h1 data-testid="new-study-organization-title">{t('title')}</h1>
      {organizations.length === 1 ? (
        organizations[0].name
      ) : (
        <Select
          data-testid="new-study-organization-select"
          value={organizationId}
          onChange={(event) => setOrganizationId(event.target.value)}
        >
          {organizations.map((organization) => (
            <MenuItem key={organization.id} value={organization.id}>
              {organization.name}
            </MenuItem>
          ))}
        </Select>
      )}
      {organization && (
        <>
          <h2>{t('sites')}</h2>
          {organization.sites.map((site) => (
            <p key={site.id}>{site.name}</p>
          ))}
          <p>TODO: ajout et modification des champs de l'organisation, pareil pour les sites</p>
          <Button data-testid="new-study-organization-button" onClick={() => selectOrganization(organization)}>
            {t('next')}
          </Button>
        </>
      )}
    </>
  )
}

export default SelectOrganization
