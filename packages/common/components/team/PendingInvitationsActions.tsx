'use client'

import LoadingButton from '@abc-transitionbascarbone/common/components/base/LoadingButton'
import { useServerFunction } from '@abc-transitionbascarbone/common/components/hooks/useServerFunction'
import { ApiResponse } from '@abc-transitionbascarbone/common/utils/serverResponse'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from './InvitationsActions.module.css'

interface Props {
  resendInvitation: () => Promise<ApiResponse>
  deleteMember: () => Promise<ApiResponse>
}

const PendingInvitationsActions = ({ resendInvitation, deleteMember }: Props) => {
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
          await callServerFunction(() => resendInvitation(), {
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
          await callServerFunction(() => deleteMember(), {
            onSuccess: () => {
              router.refresh()
            },
          })
          setDeleting(false)
        }}
        color="error"
      >
        {t('delete')}
      </LoadingButton>
    </div>
  )
}

export default PendingInvitationsActions
