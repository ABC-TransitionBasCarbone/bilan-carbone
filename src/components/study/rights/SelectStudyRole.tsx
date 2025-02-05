'use client'

import { FullStudy } from '@/db/study'
import { isAdministratorOnStudy } from '@/services/permissions/study'
import { changeStudyRole } from '@/services/serverFunctions/study'
import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { Level, StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

interface Props {
  user: User
  userRole?: StudyRole
  rowUser: FullStudy['allowedUsers'][0]['user']
  studyId: string
  studyLevel: Level
  studyOrganizationId: string
  currentRole: StudyRole
}

const SelectStudyRole = ({ user, rowUser, studyId, studyLevel, studyOrganizationId, currentRole, userRole }: Props) => {
  const t = useTranslations('study.role')
  const [role, setRole] = useState(currentRole)
  useEffect(() => {
    setRole(currentRole)
  }, [currentRole])

  const selectNewRole = (event: SelectChangeEvent<StudyRole>) => {
    const newRole = event.target.value as StudyRole
    setRole(newRole)
    if (newRole !== role) {
      changeStudyRole(studyId, rowUser.email, newRole)
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
      user.email === rowUser.email ||
      (currentRole === StudyRole.Validator &&
        userRole !== StudyRole.Validator &&
        !isAdministratorOnStudy(user, { organizationId: studyOrganizationId })) ||
      rowUser.readerOnly,
    [currentRole, rowUser, studyLevel, user, userRole],
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
          isAdministratorOnStudy(user, { organizationId: studyOrganizationId }) ||
          userRole === StudyRole.Validator ||
          isDisabled ||
          role !== StudyRole.Validator,
      ),
    [user.role, userRole, isDisabled],
  )

  return (
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
  )
}

export default SelectStudyRole
