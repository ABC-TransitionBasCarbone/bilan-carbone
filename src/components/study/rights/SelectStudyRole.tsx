'use client'

import { FullStudy } from '@/db/study'
import { changeStudyRole } from '@/services/serverFunctions/study'
import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { Level, Role, StudyRole } from '@prisma/client'
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
   * - user has readerOnly attribute (calculated by back-end if : user has no account or user is from another orgaization and level does not match the study's level)
   */
  const isDisabled = useMemo(
    () =>
      user.email === rowUser.email ||
      (currentRole === StudyRole.Validator &&
        userRole !== StudyRole.Validator &&
        (user.role !== Role.ADMIN || user.organizationId !== studyOrganizationId)) ||
      ('readerOnly' in rowUser && rowUser.readerOnly),
    [currentRole, rowUser, studyLevel, user, userRole],
  )

  return (
    <Select
      className="w100"
      data-testid="select-study-role"
      value={role}
      onChange={selectNewRole}
      disabled={isDisabled}
    >
      {Object.keys(StudyRole)
        .filter((role) => role !== StudyRole.Validator || user.role === Role.ADMIN || userRole === StudyRole.Validator)
        .map((role) => (
          <MenuItem key={role} value={role}>
            {t(role)}
          </MenuItem>
        ))}
    </Select>
  )
}

export default SelectStudyRole
