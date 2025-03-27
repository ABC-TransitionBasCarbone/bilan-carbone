// TO DELETE ts-nockeck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client'

import { TeamMember } from '@/db/account'
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
  const [validating, setValidating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const role = member.user.level ? member.role : Role.GESTIONNAIRE
  return (
    <div className={classNames(styles.buttons, 'flex')}>
      <SelectRole
        currentUserEmail={user.email}
        email={member.user.email}
        currentRole={role}
        level={member.user.level}
      />
      <LoadingButton
        data-testid="validate-invitation"
        aria-label={t('resend')}
        title={t('resend')}
        loading={validating}
        onClick={async () => {
          setValidating(true)
          const result = await validateMember(member.user.email)
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
        data-testid="delete-invitation"
        aria-label={t('delete')}
        title={t('delete')}
        loading={deleting}
        onClick={async () => {
          setDeleting(true)
          const result = await deleteMember(member.user.email)
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
