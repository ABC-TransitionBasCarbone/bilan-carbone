'use client'

import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import { Level, Role } from '@abc-transitionbascarbone/db-common/enums'
import { ApiResponse } from '@abc-transitionbascarbone/utils/serverResponse'
import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import styles from './SelectRoleCommon.module.css'

interface Props {
  currentUserEmail: string
  currentRole: Role
  email: string
  level: Level | null
  changeRole: (email: string, newRole: Role) => Promise<ApiResponse>
  environmentRoles:
    | Role
    | {
        ADMIN: 'ADMIN'
        DEFAULT: 'DEFAULT'
      }
    | {
        ADMIN: 'ADMIN'
        COLLABORATOR: 'COLLABORATOR'
      }
  canEditSelfRole?: boolean
  canBeUntrainedRole?: boolean
}

const SelectRoleCommon = ({
  currentUserEmail,
  email,
  currentRole,
  level,
  changeRole,
  environmentRoles,
  canEditSelfRole,
  canBeUntrainedRole,
}: Props) => {
  const t = useTranslations('role')
  const [role, setRole] = useState(currentRole)
  const { callServerFunction } = useServerFunction()

  const router = useRouter()
  const { update: updateSession } = useSession()

  useEffect(() => {
    setRole(currentRole)
  }, [currentRole])

  const selectNewRole = async (event: SelectChangeEvent<Role>) => {
    const newRole = event.target.value as Role
    if (newRole !== role) {
      await callServerFunction(() => changeRole(email, newRole), {
        getSuccessMessage: () => t('saved'),
        onSuccess: () => {
          setRole(newRole)
          if (email === currentUserEmail) {
            updateSession()
            router.refresh()
          }
        },
      })
    }
  }

  const disabled = useMemo(
    () => (!canEditSelfRole && currentUserEmail === email) || currentRole === Role.SUPER_ADMIN,
    [currentUserEmail, email, currentRole],
  )

  return (
    <Select className={styles.select} value={role} onChange={selectNewRole} disabled={disabled}>
      <MenuItem value={Role.SUPER_ADMIN} className={styles.hidden} aria-hidden="true">
        {t(Role.SUPER_ADMIN)}
      </MenuItem>
      {Object.keys(environmentRoles)
        .filter((role) => role !== Role.SUPER_ADMIN)
        .filter((role) => level || canBeUntrainedRole)
        .map((role) => (
          <MenuItem key={role} value={role}>
            {t(role)}
          </MenuItem>
        ))}
    </Select>
  )
}

export default SelectRoleCommon
