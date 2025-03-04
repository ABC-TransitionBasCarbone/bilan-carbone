'use client'

import { changeRole } from '@/services/serverFunctions/user'
import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { Level, Role } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Toast, { ToastColors } from '../base/Toast'
import styles from './SelectRole.module.css'

interface Props {
  currentUserEmail: string
  currentRole: Role
  email: string
  level: Level | null
}

const emptyToast = { text: '', color: 'info' } as const
const toastPosition = { vertical: 'bottom', horizontal: 'left' } as const

const SelectRole = ({ currentUserEmail, email, currentRole, level }: Props) => {
  const t = useTranslations('role')
  const [role, setRole] = useState(currentRole)
  const [toast, setToast] = useState<{ text: string; color: ToastColors }>(emptyToast)
  useEffect(() => {
    setRole(currentRole)
  }, [currentRole])

  const selectNewRole = async (event: SelectChangeEvent<Role>) => {
    const newRole = event.target.value as Role
    setRole(newRole)
    if (newRole !== role) {
      const result = await changeRole(email, newRole)
      if (result) {
        setToast({ text: result, color: 'error' })
      } else {
        setToast({ text: 'saved', color: 'success' })
      }
    }
  }

  return (
    <>
      <Select
        className={styles.select}
        value={role}
        onChange={selectNewRole}
        disabled={currentUserEmail === email || currentRole === Role.SUPER_ADMIN}
      >
        <MenuItem value={Role.SUPER_ADMIN} className={styles.hidden} aria-hidden="true">
          {t(Role.SUPER_ADMIN)}
        </MenuItem>
        {Object.keys(Role)
          .filter((role) => role !== Role.SUPER_ADMIN)
          .filter((role) => level || role === Role.GESTIONNAIRE || role === Role.DEFAULT)
          .map((role) => (
            <MenuItem key={role} value={role}>
              {t(role)}
            </MenuItem>
          ))}
      </Select>
      {toast.text && (
        <Toast
          position={toastPosition}
          onClose={() => setToast(emptyToast)}
          message={t(toast.text)}
          color={toast.color}
          toastKey="select-role-toast"
          open
        />
      )}
    </>
  )
}

export default SelectRole
