'use client'

import HomeIcon from '@mui/icons-material/Home'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import { Organization, Role } from '@prisma/client'
import classNames from 'classnames'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import LinkButton from '../base/LinkButton'
import styles from './OrganizationCard.module.css'

interface Props {
  user: User
  organizations: Organization[]
}

const OrganizationCard = ({ user, organizations }: Props) => {
  const t = useTranslations('organization.card')
  const organization = organizations.find((o) => o.id === user.organizationId)

  if (!organization) {
    return null
  }

  return (
    <div className={classNames(styles.organizationCard, 'flex w100')}>
      <div className="grow p2 justify-between align-center">
        <div className={classNames(styles.gapped, 'align-center')}>
          <HomeIcon />
          <span>{organization.name}</span>
          {user.role === Role.ADMIN && (
            <LinkButton color="secondary" href={`/organisations/${organization.id}/modifier`}>
              {t('update')}
            </LinkButton>
          )}
        </div>
        <div>
          <LinkButton
            className="align-end"
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
