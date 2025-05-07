'use client'

import { canEditSelfRole } from '@/services/permissions/user'
import { changeRole } from '@/services/serverFunctions/user'
import { CUT, useAppEnvironmentStore } from '@/store/AppEnvironment'
import { isUntrainedRole } from '@/utils/organization'
import { SEC, TIME_IN_MS } from '@/utils/time'
import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { Level, Role } from '@prisma/client'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
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
  const [toast, setToast] = useState<{ text: string; color: ToastColors; duration?: number }>(emptyToast)

  const router = useRouter()
  const { update: updateSession } = useSession()
  const { environment } = useAppEnvironmentStore()
  const isCut = useMemo(() => environment === CUT, [environment])
  useEffect(() => {
    setRole(currentRole)
  }, [currentRole])

  const selectNewRole = async (event: SelectChangeEvent<Role>) => {
    const newRole = event.target.value as Role
    if (newRole !== role) {
      const result = await changeRole(email, newRole)
      if (result) {
        setToast({ text: result, color: 'error' })
      } else {
        const duration = 3 * SEC * TIME_IN_MS
        setRole(newRole)
        setToast({ text: 'saved', color: 'success', duration })
        if (email === currentUserEmail) {
          updateSession()
          setTimeout(router.refresh, duration) // wait before refresh to display the toaster
        }
      }
    }
  }

  const disabled = useMemo(
    () => (!canEditSelfRole(currentRole) && currentUserEmail === email) || currentRole === Role.SUPER_ADMIN,
    [currentUserEmail, email, currentRole],
  )

  return (
    <>
      <Select className={styles.select} value={role} onChange={selectNewRole} disabled={disabled}>
        <MenuItem value={Role.SUPER_ADMIN} className={styles.hidden} aria-hidden="true">
          {t(Role.SUPER_ADMIN)}
        </MenuItem>
        {Object.keys(Role)
          .filter((role) => {
            if (role === Role.SUPER_ADMIN) {
              return false
            }
            if (isCut && role !== Role.ADMIN && role !== Role.COLLABORATOR) {
              return false
            }
            return level || isUntrainedRole(role as Role)
          })
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
