'use client'

import { isAdmin } from '@/services/permissions/user'
import { fetchStudyOrganization } from '@/services/serverFunctions/organization'
import { ORGANIZATION, STUDY, useAppContextStore } from '@/store/AppContext'
import HomeIcon from '@mui/icons-material/Home'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import { Organization, Role } from '@prisma/client'
import classNames from 'classnames'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import LinkButton from '../base/LinkButton'
import styles from './OrganizationCard.module.css'

interface Props {
  user: User
  organizations: Organization[]
}

const OrganizationCard = ({ user, organizations }: Props) => {
  const t = useTranslations('organization.card')

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

  const [canUpdateOrganization, setCanUpdateOrganization] = useState(hasEditionRole)

  const { context, contextId } = useAppContextStore()

  useEffect(() => {
    if (context === STUDY) {
      handleStudyContext(contextId)
    } else if (context === ORGANIZATION) {
      handleOrganizationContext(contextId)
    } else {
      setOrganization(defaultOrganization)
      setCanUpdateOrganization(hasEditionRole)
    }
  }, [context, contextId])

  const handleStudyContext = async (studyId: string) => {
    const organization = (await fetchStudyOrganization(studyId)) || defaultOrganization
    setOrganization(organization)
    setCanUpdateOrganization(hasEditionRole)
  }

  const handleOrganizationContext = async (organizationId: string) => {
    const organization = organizations.find((organization) => organization.id === organizationId) || defaultOrganization
    setOrganization(organization)
    setCanUpdateOrganization(hasEditionRole)
  }

  const organizationLink = useMemo(() => {
    const targetOrganization = organization || defaultOrganization
    return canUpdateOrganization
      ? `/organisations/${targetOrganization.id}/modifier`
      : `/organisations/${targetOrganization.id}`
  }, [organization, defaultOrganization, canUpdateOrganization])

  if (!organization) {
    return null
  }

  return (
    <div className={classNames(styles.organizationCard, 'flex w100')}>
      <div className="grow p2 justify-between align-center">
        <div className={classNames(styles.gapped, 'align-center')}>
          <HomeIcon />
          <span>{organization.name}</span>
          {hasAccess && (
            <LinkButton color="secondary" href={organizationLink}>
              {t(canUpdateOrganization ? 'update' : 'myOrganization')}
            </LinkButton>
          )}
        </div>
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
      </div>
    </div>
  )
}

export default OrganizationCard
