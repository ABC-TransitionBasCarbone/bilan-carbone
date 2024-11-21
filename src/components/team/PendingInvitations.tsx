import { TeamMember } from '@/db/user'
import { User } from 'next-auth'
import { useFormatter, useTranslations } from 'next-intl'
import { Role } from '@prisma/client'
import styles from './PendingInvitations.module.css'
import classNames from 'classnames'
import PendingInvitationsActions from './PendingInvitationsActions'
import Block from '../base/Block'

interface Props {
  user: User
  team: TeamMember[]
}

const PendingInvitations = ({ user, team }: Props) => {
  const t = useTranslations('team')
  const format = useFormatter()

  return user.role === Role.DEFAULT || team.length === 0 ? null : (
    <Block title={t('pending')}>
      <ul className={classNames(styles.members, 'flex-col')}>
        {team
          .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
          .map((member) => (
            <li key={member.email} className={classNames(styles.line, 'align-center')} data-testid="pending-invitation">
              <p>
                <span className={styles.email}>{member.email}</span>
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
