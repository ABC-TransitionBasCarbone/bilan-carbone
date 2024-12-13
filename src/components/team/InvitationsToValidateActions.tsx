'use client'

import { TeamMember } from '@/db/user'
import { deleteMember, validateMember } from '@/services/serverFunctions/user'
import CheckIcon from '@mui/icons-material/Check'
import DeleteIcon from '@mui/icons-material/Delete'
import { Button } from '@mui/material'
import classNames from 'classnames'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import styles from './InvitationsActions.module.css'
import SelectRole from './SelectRole'

interface Props {
  user: User
  member: TeamMember
}

const InvitationsToValidateActions = ({ user, member }: Props) => {
  const t = useTranslations('team')
  const router = useRouter()
  return (
    <div className={classNames(styles.buttons, 'flex')}>
      <SelectRole user={user} email={member.email} currentRole={member.role} />
      <Button
        variant="contained"
        color="success"
        onClick={async () => {
          const result = await validateMember(member.email)
          if (!result) {
            router.refresh()
          }
        }}
        aria-label={t('resend')}
      >
        <CheckIcon />
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={async () => {
          const result = await deleteMember(member.email)
          if (!result) {
            router.refresh()
          }
        }}
        aria-label={t('delete')}
      >
        <DeleteIcon />
      </Button>
    </div>
  )
}

export default InvitationsToValidateActions
