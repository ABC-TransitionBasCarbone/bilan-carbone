'use client'

import { TeamMember } from '@/db/user'
import { deleteMember, resendInvitation } from '@/services/serverFunctions/user'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Button from '../base/Button'
import styles from './PendingInvitationsActions.module.css'

interface Props {
  member: TeamMember
}

const PendingInvitationsActions = ({ member }: Props) => {
  const t = useTranslations('team')
  const router = useRouter()
  return (
    <div className={classNames(styles.buttons, 'flex')}>
      <Button
        onClick={async () => {
          const result = await resendInvitation(member.email)
          if (!result) {
            router.refresh()
          }
        }}
      >
        {t('resend')}
      </Button>
      <Button
        onClick={async () => {
          const result = await deleteMember(member.email)
          if (!result) {
            router.refresh()
          }
        }}
      >
        {t('delete')}
      </Button>
    </div>
  )
}

export default PendingInvitationsActions
