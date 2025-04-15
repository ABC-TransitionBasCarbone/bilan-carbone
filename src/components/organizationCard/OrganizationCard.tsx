// TO DELETE ts-nockeck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client'

import { OrganizationVersionWithOrganization } from '@/db/organization'
import { isAdmin } from '@/services/permissions/user'
import { getStudyOrganizationVersion } from '@/services/serverFunctions/organization'
import { ORGANIZATION, STUDY, useAppContextStore } from '@/store/AppContext'
import { CUT, useAppEnvironmentStore } from '@/store/AppEnvironment'
import { isAdmin } from '@/utils/user'
import HomeIcon from '@mui/icons-material/Home'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import { Role } from '@prisma/client'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import LinkButton from '../base/LinkButton'
import styles from './OrganizationCard.module.css'

interface Props {
  account: UserSession
  organizationVersions: OrganizationVersionWithOrganization[]
}

const OrganizationCard = ({ account, organizationVersions }: Props) => {
  const t = useTranslations('organization.card')

  const { environment } = useAppEnvironmentStore()
  const isCut = useMemo(() => environment === CUT, [environment])

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
    const organizationVersion = (await getStudyOrganizationVersion(studyId)) as OrganizationVersionWithOrganization
    setOrganizationVersion(organizationVersion || undefined)
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
    <div className={classNames(styles.organizationCard, 'flex w100')}>
      <div className="grow p2 justify-between align-center">
        <div className={classNames(styles.gapped, 'align-center')}>
          <HomeIcon />
          <span>{organizationVersion.organization.name}</span>
          {hasAccess && (
            <LinkButton color="secondary" href={organizationVersionLink}>
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
      </div>
    </div>
  )
}

export default OrganizationCard
