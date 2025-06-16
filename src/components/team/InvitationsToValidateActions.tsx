'use client'

import { TeamMember } from '@/db/account'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteMember, validateMember } from '@/services/serverFunctions/user'
import CheckIcon from '@mui/icons-material/Check'
import DeleteIcon from '@mui/icons-material/Delete'
import { Role } from '@prisma/client'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import LoadingButton from '../base/LoadingButton'
import styles from './InvitationsActions.module.css'
import SelectRole from './SelectRole'

interface Props {
  user: UserSession
  member: TeamMember
}

const InvitationsToValidateActions = ({ user, member }: Props) => {
  const t = useTranslations('team')
  const { callServerFunction } = useServerFunction()
  const [validating, setValidating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const role = member.user.level ? member.role : Role.DEFAULT

  return (
    <div className={classNames(styles.buttons, 'flex')}>
      <SelectRole
        currentUserEmail={user.email}
        email={member.user.email}
        currentRole={role}
        level={member.user.level}
        environment={user.environment}
      />
      <LoadingButton
        data-testid="validate-invitation"
        aria-label={t('resend')}
        title={t('resend')}
        loading={validating}
        onClick={async () => {
          setValidating(true)
          await callServerFunction(() => validateMember(member.user.email), {
            onSuccess: () => {
              router.refresh()
            },
          })
          setValidating(false)
        }}
        iconButton
      >
        <CheckIcon />
      </LoadingButton>
      <LoadingButton
        data-testid="delete-invitation"
        color="error"
        aria-label={t('delete')}
        title={t('delete')}
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
        iconButton
      >
        <DeleteIcon />
      </LoadingButton>
    </div>
  )
}

export default InvitationsToValidateActions
