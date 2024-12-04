'use client'

import { FullStudy } from '@/db/study'
import { changeStudyRole } from '@/services/serverFunctions/study'
import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { Level, Role, StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

interface Props {
  user: User
  userRole?: StudyRole
  rowUser: FullStudy['allowedUsers'][0]['user']
  studyId: string
  currentRole: StudyRole
}

const SelectStudyRole = ({ user, rowUser, studyId, currentRole, userRole }: Props) => {
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

  const isDisabled =
    user.email === rowUser.email ||
    (currentRole === StudyRole.Validator && userRole !== StudyRole.Validator && user.role !== Role.ADMIN) ||
    !rowUser.organizationId ||
    (user.organizationId !== rowUser.organizationId && rowUser.level === Level.Initial)

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
        .filter((role) => rowUser.organizationId || role === StudyRole.Reader)
        .map((role) => (
          <MenuItem key={role} value={role}>
            {t(role)}
          </MenuItem>
        ))}
    </Select>
  )
}

export default SelectStudyRole
