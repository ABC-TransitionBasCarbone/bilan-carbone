import { ProfessorCourseSession } from '@/db/courseSession'
import { OrganizationVersionWithOrganization } from '@/db/organization'
import { canCreateOrganization } from '@/services/permissions/organization'
import { HomeCardItem } from '@/types/homeCards'
import Box from '@abc-transitionbascarbone/common/components/base/Box'
import LinkButton from '@abc-transitionbascarbone/common/components/base/LinkButton'
import Image from '@abc-transitionbascarbone/common/components/document/Image'
import AddIcon from '@mui/icons-material/Add'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import HomeCards from './HomeCards'
import styles from './HomeCardsList.module.css'

type Props =
  | {
      type: 'clients'
      organizationVersions: OrganizationVersionWithOrganization[]
      account: UserSession
    }
  | {
      type: 'sessions'
      sessions: ProfessorCourseSession[]
      organizationVersions: OrganizationVersionWithOrganization[]
    }

const mappedOrganizationVersions = (organizationVersions: OrganizationVersionWithOrganization[]): HomeCardItem[] =>
  organizationVersions.map(({ id, organization }): HomeCardItem => ({
    id,
    name: organization.name,
    href: `/organisations/${id}`,
    type: 'client',
  }))

const HomeCardsList = async (props: Props) => {
  if (props.type === 'sessions') {
    return (
      <HomeCards
        type="sessions"
        items={[
          ...mappedOrganizationVersions(props.organizationVersions),
          ...props.sessions.map((session): HomeCardItem => ({
            ...session,
            href: `/sessions/${session.id}`,
            type: 'session',
          })),
        ]}
      />
    )
  }

  const { organizationVersions, account } = props
  const t = await getTranslations('organization')
  const canCreateOrga = await canCreateOrganization(account)

  return organizationVersions.length ? (
    <HomeCards type="clients" items={mappedOrganizationVersions(organizationVersions)} canCreateOrga={canCreateOrga} />
  ) : (
    <div className="justify-center text-center">
      <Box className={classNames(styles.firstClientCard, 'flex-col align-center')}>
        <Image src="/img/CR.png" alt="cr.png" width={177} height={119} />
        <h5>{t('createFirstClient')}</h5>
        <p>{t('firstClientMessage')}</p>
        <LinkButton
          data-testid="new-organization"
          className={classNames(styles.linkButton, 'w100 justify-center mb1')}
          href="/organisations/creer"
        >
          <AddIcon />
          {t('createFirstClient')}
        </LinkButton>
      </Box>
    </div>
  )
}

export default HomeCardsList
