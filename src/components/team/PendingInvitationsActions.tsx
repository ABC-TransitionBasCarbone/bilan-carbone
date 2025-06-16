'use client'

import { TeamMember } from '@/db/account'
import { useServerFunction } from '@/hooks/useServerFunction'
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
  const { callServerFunction } = useServerFunction()
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  return (
    <div className={classNames(styles.buttons, 'flex')}>
      <LoadingButton
        loading={sending}
        onClick={async () => {
          setSending(true)
          await callServerFunction(() => resendInvitation(member.user.email), {
            onSuccess: () => {
              router.refresh()
            },
          })
          setSending(false)
        }}
      >
        {t('resend')}
      </LoadingButton>
      <LoadingButton
        loading={deleting}
        onClick={async () => {
          setDeleting(true)
          await callServerFunction(() => deleteMember(member.user.email), {
            onSuccess: () => {
              router.refresh()
            },
          })
          setDeleting(false)
        }}
      >
        {t('delete')}
      </LoadingButton>
    </div>
  )
}

export default PendingInvitationsActions
