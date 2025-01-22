'use client'

import { TeamMember } from '@/db/user'
import { deleteMember, validateMember } from '@/services/serverFunctions/user'
import CheckIcon from '@mui/icons-material/Check'
import DeleteIcon from '@mui/icons-material/Delete'
import classNames from 'classnames'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import LoadingButton from '../base/LoadingButton'
import styles from './InvitationsActions.module.css'
import SelectRole from './SelectRole'

interface Props {
  user: User
  member: TeamMember
}

const InvitationsToValidateActions = ({ user, member }: Props) => {
  const t = useTranslations('team')
  const [validating, setValidating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  return (
    <div className={classNames(styles.buttons, 'flex')}>
      <SelectRole user={user} email={member.email} currentRole={member.role} />
      <LoadingButton
        aria-label={t('resend')}
        title={t('resend')}
        loading={validating}
        onClick={async () => {
          setValidating(true)
          const result = await validateMember(member.email)
          setValidating(false)
          if (!result) {
            router.refresh()
          }
        }}
        iconButton
      >
        <CheckIcon />
      </LoadingButton>
      <LoadingButton
        aria-label={t('delete')}
        title={t('delete')}
        loading={deleting}
        onClick={async () => {
          setDeleting(true)
          const result = await deleteMember(member.email)
          setDeleting(false)
          if (!result) {
            router.refresh()
          }
        }}
        iconButton
      >
        <DeleteIcon />
      </LoadingButton>
    </div>
  )
}

export default InvitationsToValidateActions
