import { TeamMember } from '@/db/account'
import { canEditMemberRole } from '@/utils/organization'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useFormatter, useTranslations } from 'next-intl'
import Block from '../base/Block'
import styles from './Invitations.module.css'
import PendingInvitationsActions from './PendingInvitationsActions'

interface Props {
  user: UserSession
  team: TeamMember[]
}

const PendingInvitations = ({ user, team }: Props) => {
  const t = useTranslations('team')
  const format = useFormatter()

  return !canEditMemberRole(user) || team.length === 0 ? null : (
    <Block title={t('pending')}>
      <ul className={classNames(styles.members, 'flex-col')}>
        {team
          .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
          .map((member) => (
            <li
              key={member.user.email}
              className={classNames(styles.line, 'align-center')}
              data-testid="pending-invitation"
            >
              <p>
                <span className={styles.email}>{member.user.email}</span>
                <br />
                <span className={styles.invitation}>
                  {t('invitationDate')}{' '}
                  {format.dateTime(member.updatedAt, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </p>
              <PendingInvitationsActions member={member} />
            </li>
          ))}
      </ul>
    </Block>
  )
}

export default PendingInvitations
