'use client'

import { OrganizationVersionWithOrganization } from '@/db/organization'
import { FullStudy } from '@/db/study'
import { isAdminOnStudyOrga } from '@/services/permissions/study'
import { changeStudyRole } from '@/services/serverFunctions/study'
import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { StudyRole } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import Toast, { ToastColors } from '../../base/Toast'

const emptyToast = { text: '', color: 'info' } as const
const toastPosition = { vertical: 'bottom', horizontal: 'left' } as const

interface Props {
  user: UserSession
  userRole?: StudyRole
  rowUser: FullStudy['allowedUsers'][0]['account']
  currentRole: StudyRole
  study: FullStudy
}

const SelectStudyRole = ({ user, rowUser, study, currentRole, userRole }: Props) => {
  const t = useTranslations('study.role')
  const [role, setRole] = useState(currentRole)
  const [toast, setToast] = useState<{ text: string; color: ToastColors }>(emptyToast)

  useEffect(() => {
    setRole(currentRole)
  }, [currentRole])

  const selectNewRole = async (event: SelectChangeEvent<StudyRole>) => {
    const newRole = event.target.value as StudyRole
    setRole(newRole)
    if (newRole !== role) {
      const result = await changeStudyRole(study.id, rowUser.user.email, newRole)
      if (!result.success) {
        setToast({ text: result.errorMessage, color: 'error' })
      } else {
        setToast({ text: 'saved', color: 'success' })
      }
    }
  }

  /**
   * Disabled if:
   * - user is the same as the one in the row
   * - current role is Validator and user is not Validator and (user is not admin OR user is not part of the study's organization)
   * - user has readerOnly attribute (calculated by back-end if : user has no account or user does not match the study's level)
   */
  const isDisabled = useMemo(
    () =>
      user.email === rowUser.user.email ||
      (currentRole === StudyRole.Validator &&
        userRole !== StudyRole.Validator &&
        !isAdminOnStudyOrga(user, study.organizationVersion as OrganizationVersionWithOrganization)) ||
      rowUser.readerOnly,
    [currentRole, rowUser, study, user, userRole],
  )

  /**
   * Allowed roles:
   * - if currentUser.role is admin or if the user is a validator or selector is disabled : all roles
   * - otherwise : all roles except validator
   */
  const allowedRoles = useMemo(
    () =>
      Object.keys(StudyRole).filter(
        (role) =>
          isAdminOnStudyOrga(user, study.organizationVersion as OrganizationVersionWithOrganization) ||
          userRole === StudyRole.Validator ||
          isDisabled ||
          role !== StudyRole.Validator,
      ),
    [user.role, userRole, isDisabled],
  )

  return (
    <>
      <Select
        className="w100"
        data-testid="select-study-role"
        value={role}
        onChange={selectNewRole}
        disabled={isDisabled}
      >
        {allowedRoles.map((role) => (
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

export default SelectStudyRole
