'use client'

import { useServerFunction } from '@/hooks/useServerFunction'
import { canEditSelfRole } from '@/services/permissions/user'
import { changeRole } from '@/services/serverFunctions/user'
import { canBeUntrainedRole, getEnvironmentRoles } from '@/utils/user'
import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { Environment, Level, Role } from '@prisma/client'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import styles from './SelectRole.module.css'

interface Props {
  currentUserEmail: string
  currentRole: Role
  email: string
  level: Level | null
  environment: Environment
}

const SelectRole = ({ currentUserEmail, email, currentRole, level, environment }: Props) => {
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
        setSuccessMessage: () => t('saved'),
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
    () => (!canEditSelfRole(currentRole) && currentUserEmail === email) || currentRole === Role.SUPER_ADMIN,
    [currentUserEmail, email, currentRole],
  )

  return (
    <Select className={styles.select} value={role} onChange={selectNewRole} disabled={disabled}>
      <MenuItem value={Role.SUPER_ADMIN} className={styles.hidden} aria-hidden="true">
        {t(Role.SUPER_ADMIN)}
      </MenuItem>
      {Object.keys(getEnvironmentRoles(environment))
        .filter((role) => role !== Role.SUPER_ADMIN)
        .filter((role) => level || canBeUntrainedRole(role as Role, environment))
        .map((role) => (
          <MenuItem key={role} value={role}>
            {t(role)}
          </MenuItem>
        ))}
    </Select>
  )
}

export default SelectRole
