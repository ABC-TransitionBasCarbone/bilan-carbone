'use client'

import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import { Environment, Level, Role } from '@abc-transitionbascarbone/db-common/enums'
import { ApiResponse } from '@abc-transitionbascarbone/utils/serverResponse'
import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { canBeUntrainedRole } from '@abc-transitionbascarbone/utils/user'
import styles from './SelectRoleCommon.module.css'
import { RoleBcOrMip } from '@abc-transitionbascarbone/utils/types'

interface Props {
  currentUserEmail: string
  currentRole: RoleBcOrMip
  email: string
  level: Level | null
  environmentRoles: RoleBcOrMip[]
  environment: Environment
  changeRole?: (email: string, newRole: RoleBcOrMip) => Promise<ApiResponse>
  setLocalRole?: (newRole: RoleBcOrMip) => void
  canEditSelfRole?: boolean
}

const SelectRoleCommon = ({
  currentUserEmail,
  email,
  currentRole,
  level,
  changeRole,
  setLocalRole,
  environmentRoles,
  environment,
  canEditSelfRole,
}: Props) => {
  const t = useTranslations('role')
  const [role, setRole] = useState(currentRole)
  const { callServerFunction } = useServerFunction()

  const router = useRouter()
  const { update: updateSession } = useSession()

  useEffect(() => {
    setRole(currentRole)
  }, [currentRole])

  const selectNewRole = async (event: SelectChangeEvent<RoleBcOrMip>) => {
    const newRole = event.target.value as RoleBcOrMip
    if (newRole !== role && changeRole) {
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
    } else if (setLocalRole) {
      setLocalRole(newRole)
      setRole(newRole)
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
      {environmentRoles
        .filter((role) => role !== Role.SUPER_ADMIN)
        .filter((role) => level || canBeUntrainedRole(role, environment))
        .map((role) => (
          <MenuItem key={role} value={role}>
            {t(role)}
          </MenuItem>
        ))}
    </Select>
  )
}

export default SelectRoleCommon
