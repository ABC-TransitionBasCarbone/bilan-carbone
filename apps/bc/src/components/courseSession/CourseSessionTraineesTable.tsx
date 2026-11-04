'use client'

import type { CourseSessionTrainee } from '@/db/courseSession'
import { deleteCourseSessionTrainee } from '@/services/serverFunctions/courseSession'
import tableStyles from '@abc-transitionbascarbone/common/components/base/Table.module.css'
import { TableActionButton } from '@abc-transitionbascarbone/common/components/base/TableActionButton'
import { useServerFunction } from '@abc-transitionbascarbone/common/components/hooks/useServerFunction'
import Modal from '@abc-transitionbascarbone/common/components/modals/Modal'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  sessionId: string
  trainees: CourseSessionTrainee[]
}

const CourseSessionTraineesTable = ({ sessionId, trainees }: Props) => {
  const t = useTranslations('courseSessions')
  const tTeam = useTranslations('team.table')
  const tAction = useTranslations('common.action')
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const [deletingTrainee, setDeletingTrainee] = useState<CourseSessionTrainee | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const closeDeletion = () => {
    if (!isDeleting) {
      setDeletingTrainee(null)
    }
  }

  const deleteTrainee = async () => {
    const organizationVersionId = deletingTrainee?.organizationVersionId
    if (!organizationVersionId || isDeleting) {
      return
    }

    setIsDeleting(true)
    try {
      await callServerFunction(() => deleteCourseSessionTrainee(sessionId, organizationVersionId), {
        onSuccess: () => {
          setDeletingTrainee(null)
          router.refresh()
        },
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className={classNames(tableStyles.tableContainer, 'mt2')}>
        <Table aria-labelledby="course-session-trainees-table-title" className={tableStyles.tableWrapper}>
          <TableHead>
            <TableRow className={tableStyles.headers}>
              <TableCell scope="col">{tTeam('lastName')}</TableCell>
              <TableCell scope="col">{tTeam('firstName')}</TableCell>
              <TableCell scope="col">{tTeam('email')}</TableCell>
              <TableCell scope="col" className={tableStyles.actionsColumn} />
            </TableRow>
          </TableHead>
          <TableBody>
            {trainees.map((trainee) => (
              <TableRow key={trainee.id} className={tableStyles.line} data-testid="course-session-trainees-table-row">
                <TableCell data-testid="course-session-trainees-user_lastName">{trainee.user.lastName}</TableCell>
                <TableCell data-testid="course-session-trainees-user_firstName">{trainee.user.firstName}</TableCell>
                <TableCell data-testid="course-session-trainees-user_email">{trainee.user.email}</TableCell>
                <TableCell className={tableStyles.actionsColumn} data-testid="course-session-trainees-actions">
                  <TableActionButton
                    type="delete"
                    onClick={() => setDeletingTrainee(trainee)}
                    disabled={isDeleting}
                    aria-label={t('deleteTraineeLabel', {
                      firstName: trainee.user.firstName,
                      lastName: trainee.user.lastName,
                    })}
                    data-testid="delete-trainee-button"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!trainees.length && <p role="status">{t('emptyTrainees')}</p>}
      <Modal
        open={!!deletingTrainee}
        label="trainee-deletion"
        title={t('deleteTraineeTitle')}
        onClose={closeDeletion}
        actions={[
          {
            actionType: 'button',
            onClick: closeDeletion,
            disabled: isDeleting,
            children: tAction('cancel'),
            'data-testid': 'delete-trainee-cancel',
          },
          {
            actionType: 'button',
            onClick: deleteTrainee,
            disabled: isDeleting,
            children: tAction('confirm'),
            'data-testid': 'delete-trainee-confirm',
          },
        ]}
      >
        {deletingTrainee &&
          t('deleteTraineeDescription', {
            firstName: deletingTrainee.user.firstName,
            lastName: deletingTrainee.user.lastName,
          })}
      </Modal>
    </>
  )
}

export default CourseSessionTraineesTable
