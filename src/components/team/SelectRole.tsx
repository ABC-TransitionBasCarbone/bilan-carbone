'use client'

import { changeRole } from '@/services/serverFunctions/user'
import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { Role } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import styles from './SelectRole.module.css'

interface Props {
  user: User
  email: string
  currentRole: Role
}

const SelectRole = ({ user, email, currentRole }: Props) => {
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
      disabled={user.email === email || currentRole === Role.SUPER_ADMIN}
    >
      <MenuItem value={Role.SUPER_ADMIN} className={styles.hidden} aria-hidden="true">
        {t(Role.SUPER_ADMIN)}
      </MenuItem>
      {Object.keys(Role)
        .filter((role) => role !== Role.SUPER_ADMIN)
        .map((role) => (
          <MenuItem key={role} value={role}>
            {t(role)}
          </MenuItem>
        ))}
    </Select>
  )
}

export default SelectRole
