'use client'

import Modal from '@/components/modals/Modal'
import WarningIcon from '@mui/icons-material/Warning'
import { Typography } from '@mui/material'
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
  const tType = useTranslations('study.transitionPlan.trajectoryModal')

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
          color: 'warning',
        },
      ]}
    >
      <div className={styles.container}>
        <div className={styles.warningHeader}>
          <WarningIcon className={styles.warningIcon} />
          <Typography variant="h6">{t('warningTitle')}</Typography>
        </div>

        <Typography variant="body1" className={styles.message}>
          {t('message', { trajectoryName, trajectoryType: tType(`type.${trajectoryType}`) })}
        </Typography>

        <Typography variant="body2" color="textSecondary" className={styles.explanation}>
          {t('explanation')}
        </Typography>
      </div>
    </Modal>
  )
}

export default TrajectoryConversionWarningModal
