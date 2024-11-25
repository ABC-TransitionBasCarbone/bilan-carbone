'use client'

import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import Sites from '@/components/organization/Sites'
import { OrganizationWithSites } from '@/db/user'
import { MenuItem, Select } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'

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
    <Block title={t('title')} as="h1" data-testid="new-study-organization-title">
      {organizations.length === 1 ? (
        <p className="title-h2">{organizations[0].name}</p>
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
          <Sites sites={organization.sites} />
          <div className="mt2">
            <Button data-testid="new-study-organization-button" onClick={() => selectOrganization(organization)}>
              {t('next')}
            </Button>
          </div>
        </>
      )}
    </Block>
  )
}

export default SelectOrganization
