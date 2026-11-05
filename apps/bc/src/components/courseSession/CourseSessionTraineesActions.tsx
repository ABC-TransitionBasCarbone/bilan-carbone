'use client'

import { MenuItem, Select } from '@mui/material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface Props {
  sessionId: string
}

const CourseSessionTraineesActions = ({ sessionId }: Props) => {
  const t = useTranslations('courseSessions')
  const tAction = useTranslations('common.action')

  return (
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
      <MenuItem value="attendance">{t('signAttendance')}</MenuItem>
    </Select>
  )
}

export default CourseSessionTraineesActions
