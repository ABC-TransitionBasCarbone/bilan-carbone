'use client'

import { OrganizationVersionWithOrganization } from '@/db/organization'
import { getStudyOrganizationVersion } from '@/services/serverFunctions/organization'
import { ORGANIZATION, STUDY, useAppContextStore } from '@/store/AppContext'
import { canEditOrganizationVersion, isInOrgaOrParent } from '@/utils/organization'
import HomeIcon from '@mui/icons-material/Home'
import { AppBar, Box, Button, styled, Toolbar, ToolbarProps, Typography } from '@mui/material'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from '../base/Link'

interface Props {
  account: UserSession
  organizationVersions: OrganizationVersionWithOrganization[]
  shouldDisplayOrgaData: boolean
  shouldRenewLicense: boolean
}

const OrganizationToolbar = styled(Toolbar)<ToolbarProps>(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.text.primary,
  borderBottom: theme.custom.navbar.organizationToolbar?.border,
}))

const renewalLink = process.env.NEXT_PUBLIC_LICENSE_RENEWAL_LINK

const OrganizationCard = ({ account, organizationVersions, shouldDisplayOrgaData, shouldRenewLicense }: Props) => {
  const t = useTranslations('organization.card')

  const date = new Date()

  const defaultOrganizationVersion = organizationVersions.find(
    (organizationVersion) => organizationVersion.id === account.organizationVersionId,
  ) as OrganizationVersionWithOrganization
  const [organizationVersion, setOrganizationVersion] = useState<OrganizationVersionWithOrganization | undefined>(
    undefined,
  )

  const { context, contextId } = useAppContextStore()

  const handleOrganizationContext = useCallback(
    async (organizationVersionId: string) => {
      const organizationVersion = organizationVersions.find(
        (organizationVersion) => organizationVersion.id === organizationVersionId,
      ) as OrganizationVersionWithOrganization
      setOrganizationVersion(organizationVersion)
    },
    [organizationVersions],
  )

  useEffect(() => {
    if (context === STUDY) {
      handleStudyContext(contextId)
    } else if (context === ORGANIZATION) {
      handleOrganizationContext(contextId)
    } else {
      setOrganizationVersion(defaultOrganizationVersion)
    }
  }, [context, contextId, defaultOrganizationVersion, handleOrganizationContext])

  const handleStudyContext = async (studyId: string) => {
    const organizationVersion = await getStudyOrganizationVersion(studyId)
    if (organizationVersion.success) {
      setOrganizationVersion((organizationVersion.data as OrganizationVersionWithOrganization) || undefined)
    }
  }

  const [hasAccess, hasEditionRole] = useMemo(() => {
    if (!organizationVersion) {
      return [false, false]
    }

    const userIsInOrgaOrParent = isInOrgaOrParent(account.organizationVersionId, organizationVersion)
    const userCanEdit = canEditOrganizationVersion(account, organizationVersion)

    return [userIsInOrgaOrParent, userCanEdit]
  }, [account, organizationVersion])

  const organizationVersionLink = useMemo(() => {
    const targetOrganizationVersion = organizationVersion || defaultOrganizationVersion
    return hasEditionRole
      ? `/organisations/${targetOrganizationVersion.id}/modifier`
      : `/organisations/${targetOrganizationVersion.id}`
  }, [organizationVersion, defaultOrganizationVersion, hasEditionRole])

  if (!organizationVersion) {
    return null
  }

  const linkLabel = hasEditionRole
    ? organizationVersion.id === defaultOrganizationVersion.id
      ? 'update'
      : 'updateClient'
    : organizationVersion.id === defaultOrganizationVersion.id
      ? 'myOrganization'
      : 'myClient'

  return (
    <AppBar position="sticky">
      <OrganizationToolbar>
        <Box display="flex" alignItems="center" gap={10}>
          {shouldDisplayOrgaData && (
            <div className="align-center gapped">
              <HomeIcon />
              <Typography>{organizationVersion.organization.name}</Typography>
              {hasAccess && (
                <Button color="secondary" href={organizationVersionLink} variant="outlined">
                  {t(linkLabel)}
                </Button>
              )}
            </div>
          )}
          {shouldRenewLicense && renewalLink && (
            <div className="align-center gapped">
              <Typography>{t('renew', { year: date.getFullYear(), nextYear: date.getFullYear() + 1 })}</Typography>
              <Link color="secondary" href={renewalLink} target="_blank" rel="noreferrer noopener">
                {t('renewLink')}
              </Link>
            </div>
          )}
        </Box>
      </OrganizationToolbar>
    </AppBar>
  )
}

export default OrganizationCard
