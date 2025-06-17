'use client'

import { OrganizationVersionWithOrganization } from '@/db/organization'
import { getStudyOrganizationVersion } from '@/services/serverFunctions/organization'
import { ORGANIZATION, STUDY, useAppContextStore } from '@/store/AppContext'
import { isAdmin } from '@/utils/user'
import HomeIcon from '@mui/icons-material/Home'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import { AppBar, Box, Button, styled, Toolbar, ToolbarProps, Typography } from '@mui/material'
import { Environment, Role } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import styles from './OrganizationCard.module.css'

interface Props {
  account: UserSession
  organizationVersions: OrganizationVersionWithOrganization[]
}

const OrganizationToolbar = styled(Toolbar)<ToolbarProps>(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.text.primary,
  borderBottom: theme.custom.navbar.organizationToolbar?.border,
}))

const OrganizationCard = ({ account, organizationVersions }: Props) => {
  const t = useTranslations('organization.card')

  const isCut = useMemo(() => account.environment === Environment.CUT, [account?.environment])

  const defaultOrganizationVersion = organizationVersions.find(
    (organizationVersion) => organizationVersion.id === account.organizationVersionId,
  ) as OrganizationVersionWithOrganization
  const [organizationVersion, setOrganizationVersion] = useState<
    Pick<OrganizationVersionWithOrganization, 'id' | 'organization'> | undefined
  >(undefined)

  const [hasAccess, hasEditionRole] = useMemo(
    () =>
      organizationVersion &&
      organizationVersions.map((organizationVersion) => organizationVersion.id).includes(organizationVersion.id)
        ? [true, isAdmin(account.role) || account.role === Role.GESTIONNAIRE || defaultOrganizationVersion.isCR]
        : [false, false],
    [account.role, organizationVersions, defaultOrganizationVersion, organizationVersion],
  )

  const { context, contextId } = useAppContextStore()

  useEffect(() => {
    if (context === STUDY) {
      handleStudyContext(contextId)
    } else if (context === ORGANIZATION) {
      handleOrganizationContext(contextId)
    } else {
      setOrganizationVersion(defaultOrganizationVersion)
    }
  }, [context, contextId])

  const handleStudyContext = async (studyId: string) => {
    const organizationVersion = await getStudyOrganizationVersion(studyId)
    if (organizationVersion.success) {
      setOrganizationVersion((organizationVersion.data as OrganizationVersionWithOrganization) || undefined)
    }
  }

  const handleOrganizationContext = async (organizationVersionId: string) => {
    const organizationVersion = organizationVersions.find(
      (organizationVersion) => organizationVersion.id === organizationVersionId,
    ) as OrganizationVersionWithOrganization
    setOrganizationVersion(organizationVersion)
  }

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
    <AppBar className={styles.appBar}>
      <OrganizationToolbar>
        <Box display="flex" alignItems="center" gap={2}>
          <HomeIcon />
          <Typography>{organizationVersion.organization.name}</Typography>
          {hasAccess && (
            <Button color="secondary" href={organizationVersionLink} variant="outlined">
              {t(linkLabel)}
            </Button>
          )}
        </Box>
        {!isCut && (
          <Button
            color="secondary"
            target="_blank"
            rel="noreferrer noopener"
            href="https://www.bilancarbone-methode.com/"
            variant="outlined"
            startIcon={<MenuBookIcon />}
          >
            {t('method')}
          </Button>
        )}
      </OrganizationToolbar>
    </AppBar>
  )
}

export default OrganizationCard
