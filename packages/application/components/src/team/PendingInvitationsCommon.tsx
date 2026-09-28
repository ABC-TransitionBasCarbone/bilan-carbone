import Block from '@abc-transitionbascarbone/components/src/base/Block'
import classNames from 'classnames'
import { useFormatter, useTranslations } from 'next-intl'
import styles from './Invitations.module.css'
import PendingInvitationsActions from '@abc-transitionbascarbone/components/src/team/PendingInvitationsActions'
import { TeamMemberCommon } from './TeamTableCommon'
import { ApiResponse } from '@abc-transitionbascarbone/utils/serverResponse'

interface Props {
  team: TeamMemberCommon[]
  resendInvitation: (email: string) => Promise<ApiResponse>
  deleteMember: (email: string) => Promise<ApiResponse>
}

const PendingInvitationsCommon = ({ team, resendInvitation, deleteMember }: Props) => {
  const t = useTranslations('team')
  const format = useFormatter()

  return (
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
              <PendingInvitationsActions resendInvitation={() => resendInvitation(member.user.email)} deleteMember={() => deleteMember(member.user.email)} />
            </li>
          ))}
      </ul>
    </Block>
  )
}

export default PendingInvitationsCommon
