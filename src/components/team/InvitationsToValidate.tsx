import { TeamMember } from '@/db/user'
import { Role } from '@prisma/client'
import classNames from 'classnames'
import { User } from 'next-auth'
import { useFormatter, useTranslations } from 'next-intl'
import Block from '../base/Block'
import styles from './Invitations.module.css'
import InvitationsToValidateActions from './InvitationsToValidateActions'

interface Props {
  user: User
  team: TeamMember[]
}

const InvitationsToValidate = ({ user, team }: Props) => {
  const t = useTranslations('team')
  const format = useFormatter()

  return user.role === Role.COLLABORATOR || team.length === 0 ? null : (
    <Block title={t('toValidate')}>
      <ul data-testid="invitations-to-validate" className={classNames(styles.members, 'flex-col')}>
        {team.map((member) => (
          <li data-testid="invitation" key={member.email} className={classNames(styles.line, 'align-center')}>
            <p>
              <span className={styles.email}>{member.email}</span>
              <br />
              <span className={styles.invitation}>
                {t('addedDate')}{' '}
                {format.dateTime(member.updatedAt, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </p>
            <InvitationsToValidateActions member={member} user={user} />
          </li>
        ))}
      </ul>
    </Block>
  )
}

export default InvitationsToValidate
