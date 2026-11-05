'use client'

import type { CourseSessionTrainee } from '@/db/courseSession'
import { updateCourseSessionAttendance } from '@/services/serverFunctions/courseSession'
import { getInitialAttendanceSelection } from '@/utils/courseSessionAttendance'
import { useServerFunction } from '@abc-transitionbascarbone/common/components/hooks/useServerFunction'
import Modal from '@abc-transitionbascarbone/common/components/modals/Modal'
import { useToast } from '@abc-transitionbascarbone/common/ui'
import { formatDateFr } from '@abc-transitionbascarbone/common/utils'
import { Checkbox, Divider, FormControlLabel, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  sessionId: string
  trainees: CourseSessionTrainee[]
  endDate: Date
  onClose: () => void
}

const CourseSessionAttendanceModal = ({ sessionId, trainees, endDate, onClose }: Props) => {
  const t = useTranslations('courseSessions')
  const tAction = useTranslations('common.action')
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const { showSuccessToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const organizationVersionIds = [
    ...new Set(trainees.flatMap((trainee) => (trainee.organizationVersionId ? [trainee.organizationVersionId] : []))),
  ]
  const [selectedIds, setSelectedIds] = useState(() => getInitialAttendanceSelection(trainees))
  const allSelected = selectedIds.length === organizationVersionIds.length

  const close = () => {
    if (!isSaving) {
      onClose()
    }
  }

  const confirm = async () => {
    if (isSaving) {
      return
    }
    setIsSaving(true)
    try {
      await callServerFunction(
        () => updateCourseSessionAttendance(sessionId, { organizationVersionIds: selectedIds }),
        {
          onSuccess: () => {
            showSuccessToast(t('attendanceSaved'))
            router.refresh()
            onClose()
          },
        },
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      open
      label="course-session-attendance"
      title={t('signAttendance')}
      onClose={close}
      actions={[
        {
          actionType: 'button',
          children: tAction('cancel'),
          onClick: close,
          disabled: isSaving,
        },
        {
          actionType: 'loadingButton',
          children: tAction('confirm'),
          onClick: confirm,
          loading: isSaving,
          disabled: isSaving,
          'data-testid': 'attendance-confirm',
        },
      ]}
    >
      <Typography>
        {t('attendanceDescription', {
          date: formatDateFr(endDate),
        })}
      </Typography>
      <FormControlLabel
        label={t('selectAllTrainees')}
        control={
          <Checkbox
            checked={allSelected}
            indeterminate={selectedIds.length > 0 && !allSelected}
            disabled={isSaving}
            onChange={(_, checked) => setSelectedIds(checked ? organizationVersionIds : [])}
          />
        }
      />
      <Divider />
      {trainees.map((trainee) => (
        <FormControlLabel
          key={trainee.id}
          label={
            <div className="flex-col">
              <Typography>
                {trainee.user.firstName} {trainee.user.lastName}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {trainee.user.email}
              </Typography>
            </div>
          }
          control={
            <Checkbox
              checked={!!trainee.organizationVersionId && selectedIds.includes(trainee.organizationVersionId)}
              disabled={isSaving || !trainee.organizationVersionId}
              onChange={(_, checked) => {
                const id = trainee.organizationVersionId
                if (id) {
                  setSelectedIds((previous) =>
                    checked ? [...new Set([...previous, id])] : previous.filter((selectedId) => selectedId !== id),
                  )
                }
              }}
            />
          }
        />
      ))}
      <Typography variant="body2" color="textSecondary" role="status">
        {t('attendanceSelectionCount', { count: selectedIds.length, total: organizationVersionIds.length })}
      </Typography>
    </Modal>
  )
}

export default CourseSessionAttendanceModal
