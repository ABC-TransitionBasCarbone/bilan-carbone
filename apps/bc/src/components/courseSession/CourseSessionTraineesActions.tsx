'use client'

import type { CourseSessionTrainee } from '@/db/courseSession'
import { MenuItem, Select } from '@mui/material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import CourseSessionAttendanceModal from './CourseSessionAttendanceModal'

interface Props {
  sessionId: string
  trainees: CourseSessionTrainee[]
  endDate: Date
}

const CourseSessionTraineesActions = ({ sessionId, trainees, endDate }: Props) => {
  const t = useTranslations('courseSessions')
  const tAction = useTranslations('common.action')
  const [attendanceOpen, setAttendanceOpen] = useState(false)

  return (
    <>
      <Select
        id="course-session-trainees-actions"
        value=""
        displayEmpty
        renderValue={() => tAction('actions')}
        inputProps={{ 'aria-label': tAction('actions') }}
      >
        <MenuItem component={Link} href={`/sessions/${sessionId}/formees/ajouter`}>
          {t('addTrainee')}
        </MenuItem>
        <MenuItem value="attendance" disabled={!trainees.length} onClick={() => setAttendanceOpen(true)}>
          {t('signAttendance')}
        </MenuItem>
      </Select>
      {attendanceOpen && (
        <CourseSessionAttendanceModal
          sessionId={sessionId}
          trainees={trainees}
          endDate={endDate}
          onClose={() => setAttendanceOpen(false)}
        />
      )}
    </>
  )
}

export default CourseSessionTraineesActions
