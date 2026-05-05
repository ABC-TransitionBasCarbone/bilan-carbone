'use client'

import Modal from '@/components/modals/Modal'
import { getTrajectoryTypeLabel } from '@/utils/trajectory'
import type { TrajectoryType } from '@abc-transitionbascarbone/db-common'
import { Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './TrajectoryConversionWarningModal.module.css'

interface Props {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  trajectoryName: string
  trajectoryType: string
}

const TrajectoryConversionWarningModal = ({ open, onConfirm, onCancel, trajectoryName, trajectoryType }: Props) => {
  const t = useTranslations('study.transitionPlan.conversionWarning')
  const tTypes = useTranslations('study.transitionPlan.objectives')

  const trajectoryTypeLabel = getTrajectoryTypeLabel(trajectoryType as TrajectoryType, tTypes)

  return (
    <Modal
      label="trajectory-conversion-warning"
      open={open}
      onClose={onCancel}
      title={t('title')}
      actions={[
        {
          children: t('cancel'),
          onClick: onCancel,
          variant: 'outlined',
        },
        {
          children: t('confirm'),
          onClick: onConfirm,
          variant: 'contained',
          color: 'primary',
        },
      ]}
    >
      <div className={'flex-col gapped1'}>
        <Typography variant="body1" color="error">
          {t('warningTitle')}
        </Typography>

        <Typography variant="body1">{t('message', { trajectoryName, trajectoryType: trajectoryTypeLabel })}</Typography>

        <Typography variant="body1" color="textSecondary" className={classNames('p1', styles.explanation)}>
          {t('explanation', { trajectoryType: trajectoryTypeLabel })}
        </Typography>
      </div>
    </Modal>
  )
}

export default TrajectoryConversionWarningModal
