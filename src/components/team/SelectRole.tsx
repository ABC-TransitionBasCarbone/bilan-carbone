'use client'

import { changeRole } from '@/services/serverFunctions/user'
import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { Level, Role } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import styles from './SelectRole.module.css'

interface Props {
  currentUserEmail: string
  currentRole: Role
  email: string
  level: Level | null
}

const SelectRole = ({ currentUserEmail, email, currentRole, level }: Props) => {
  const t = useTranslations('role')
  const [role, setRole] = useState(currentRole)
  useEffect(() => {
    setRole(currentRole)
  }, [currentRole])

  const selectNewRole = (event: SelectChangeEvent<Role>) => {
    const newRole = event.target.value as Role
    setRole(newRole)
    if (newRole !== role) {
      changeRole(email, newRole)
      // TODO: add a confirmation toast
    }
  }

  return (
    <Select
      className={styles.select}
      value={role}
      onChange={selectNewRole}
      disabled={currentUserEmail === email || !level || currentRole === Role.SUPER_ADMIN}
    >
      <MenuItem value={Role.SUPER_ADMIN} className={styles.hidden} aria-hidden="true">
        {t(Role.SUPER_ADMIN)}
      </MenuItem>
      {Object.keys(Role)
        .filter((role) => role !== Role.SUPER_ADMIN)
        .filter((role) => level || role === Role.GESTIONNAIRE)
        .map((role) => (
          <MenuItem key={role} value={role}>
            {t(role)}
          </MenuItem>
        ))}
    </Select>
  )
}

export default SelectRole
