'use client'

import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { Role, StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import { changeStudyRole } from '@/services/serverFunctions/study'

interface Props {
  user: User
  userRole?: StudyRole
  email: string
  studyId: string
  currentRole: StudyRole
}

const SelectStudyRole = ({ user, email, studyId, currentRole, userRole }: Props) => {
  const t = useTranslations('study.role')
  const [role, setRole] = useState(currentRole)
  useEffect(() => {
    setRole(currentRole)
  }, [currentRole])

  const selectNewRole = (event: SelectChangeEvent<StudyRole>) => {
    const newRole = event.target.value as StudyRole
    setRole(newRole)
    if (newRole !== role) {
      changeStudyRole(studyId, email, newRole)
    }
  }

  return (
    <Select
      className="w100"
      data-testid="select-study-role"
      value={role}
      onChange={selectNewRole}
      disabled={
        user.email === email ||
        (currentRole === StudyRole.Validator && userRole !== StudyRole.Validator && user.role !== Role.ADMIN)
      }
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
