'use client'

import { isAdmin } from '@/services/permissions/user'
import { getStudyOrganization } from '@/services/serverFunctions/organization'
import { ORGANIZATION, STUDY, useAppContextStore } from '@/store/AppContext'
import { CUT, useAppEnvironmentStore } from '@/store/AppEnvironment'
import HomeIcon from '@mui/icons-material/Home'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import { Organization, Role } from '@prisma/client'
import classNames from 'classnames'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import LinkButton from '../base/LinkButton'
import styles from './OrganizationCard.module.css'
import { Box, Button, styled, Toolbar, ToolbarProps, Typography } from '@mui/material'

interface Props {
  user: User
  organizations: Organization[]
}

const OrganizationToolbar = styled(Toolbar)<ToolbarProps>(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.text.primary,
  borderBottom: theme.custom.navbar.organizationToolbar?.border,
}))

const OrganizationCard = ({ user, organizations }: Props) => {
  const t = useTranslations('organization.card')

  const { environment } = useAppEnvironmentStore()
  const isCut = useMemo(() => environment === CUT, [environment])

  const defaultOrganization = organizations.find(
    (organization) => organization.id === user.organizationId,
  ) as Organization
  const [organization, setOrganization] = useState<Pick<Organization, 'id' | 'name'> | undefined>(undefined)

  const [hasAccess, hasEditionRole] = useMemo(
    () =>
      organization && organizations.map((organization) => organization.id).includes(organization.id)
        ? [true, isAdmin(user.role) || user.role === Role.GESTIONNAIRE || defaultOrganization.isCR]
        : [false, false],
    [user.role, organizations, defaultOrganization, organization],
  )

  const { context, contextId } = useAppContextStore()

  useEffect(() => {
    if (context === STUDY) {
      handleStudyContext(contextId)
    } else if (context === ORGANIZATION) {
      handleOrganizationContext(contextId)
    } else {
      setOrganization(defaultOrganization)
    }
  }, [context, contextId])

  const handleStudyContext = async (studyId: string) => {
    const organization = await getStudyOrganization(studyId)
    setOrganization(organization || undefined)
  }

  const handleOrganizationContext = async (organizationId: string) => {
    const organization = organizations.find((organization) => organization.id === organizationId)
    setOrganization(organization)
  }

  const organizationLink = useMemo(() => {
    const targetOrganization = organization || defaultOrganization
    return hasEditionRole
      ? `/organisations/${targetOrganization.id}/modifier`
      : `/organisations/${targetOrganization.id}`
  }, [organization, defaultOrganization, hasEditionRole])

  if (!organization) {
    return null
  }

  const linkLabel = hasEditionRole
    ? organization.id === defaultOrganization.id
      ? 'update'
      : 'updateClient'
    : organization.id === defaultOrganization.id
      ? 'myOrganization'
      : 'myClient'

  return (
    <OrganizationToolbar>
      <Box display='flex' alignItems='center' gap={2}>
        <HomeIcon />
        <Typography>{organization.name}</Typography>
        {hasAccess && (
          <Button color='secondary' href={organizationLink} variant='outlined'>{t(linkLabel)}</Button>
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
      {/* <div className="grow p2 justify-between align-center">
        <div className={classNames(styles.gapped, 'align-center')}>
          <HomeIcon />
          <span>{organization.name}</span>
          {hasAccess && (
            <LinkButton color="secondary" href={organizationLink}>
              {t(linkLabel)}
            </LinkButton>
          )}
        </div>
        {!isCut && (
          <div>
            <LinkButton
              className="align-end"
              color="secondary"
              target="_blank"
              rel="noreferrer noopener"
              href="https://www.bilancarbone-methode.com/"
            >
              <MenuBookIcon />
              <span className="ml-2">{t('method')}</span>
            </LinkButton>
          </div>
        )}
      </div> */}
    </OrganizationToolbar>
  )
}

export default OrganizationCard
