'use client'

import StyledChip from '@/components/base/StyledChip'
import { AccountWithUser } from '@/db/account'
import { FullStudy } from '@/db/study'
import { getDisplayedRoleOnStudy } from '@/utils/study'
import { accountWithUserToUserSession } from '@/utils/userAccounts'
import SpaIcon from '@mui/icons-material/Spa'
import { useTranslations } from 'next-intl'

interface Props {
  study: FullStudy
  editor: AccountWithUser
}

const EmissionSourceEditorChip = ({ study, editor }: Props) => {
  const tRole = useTranslations('study.role')
  const accountRoleOnStudy = getDisplayedRoleOnStudy(accountWithUserToUserSession(editor), study)

  return (
    <StyledChip
      color="success"
      label={
        editor.user.firstName || editor.user.lastName
          ? `${editor.user.firstName} ${editor.user.lastName}`
          : editor.user.email
      }
      icon={<SpaIcon />}
      subtitle={accountRoleOnStudy ? tRole(accountRoleOnStudy) : undefined}
      roleClass={accountRoleOnStudy ? accountRoleOnStudy.toLowerCase() : 'validator'}
    />
  )
}

export default EmissionSourceEditorChip
