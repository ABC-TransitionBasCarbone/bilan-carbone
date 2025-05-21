'use client'

import { TeamMember } from '@/db/account'
import { deleteMember, resendInvitation } from '@/services/serverFunctions/user'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import LoadingButton from '../base/LoadingButton'
import styles from './InvitationsActions.module.css'

interface Props {
  member: TeamMember
}

const PendingInvitationsActions = ({ member }: Props) => {
  const t = useTranslations('team')
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  return (
    <div className={classNames(styles.buttons, 'flex')}>
      <LoadingButton
        loading={sending}
        onClick={async () => {
          setSending(true)
          const result = await resendInvitation(member.user.email)
          setSending(false)
          if (result.success) {
            router.refresh()
          }
        }}
      >
        {t('resend')}
      </LoadingButton>
      <LoadingButton
        color="error"
        loading={deleting}
        onClick={async () => {
          setDeleting(true)
          const result = await deleteMember(member.user.email)
          setDeleting(false)
          if (!result) {
            router.refresh()
          }
        }}
      >
        {t('delete')}
      </LoadingButton>
    </div>
  )
}

export default PendingInvitationsActions
