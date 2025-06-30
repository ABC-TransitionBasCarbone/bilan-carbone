'use client'

import Modal from '@/components/modals/Modal'
import { ControlMode } from '@prisma/client'
import { useTranslations } from 'next-intl'

interface Props {
  open: boolean
  currentMode: ControlMode
  newMode: ControlMode
  onConfirm: () => void
  onCancel: () => void
}

const ControlModeChangeWarningModal = ({ open, currentMode, newMode, onConfirm, onCancel }: Props) => {
  const t = useTranslations('study.perimeter.controlModeWarning')
  const tControlModes = useTranslations('study.new')

  return (
    <Modal
      open={open}
      label="control-mode-change-warning"
      title={t('title')}
      onClose={onCancel}
      actions={[
        { actionType: 'button', onClick: onCancel, children: t('cancel') },
        {
          actionType: 'button',
          onClick: onConfirm,
          children: t('continue'),
          ['data-testid']: 'control-mode-change-confirm',
          color: 'error',
        },
      ]}
    >
      <div>
        {t.rich('description', {
          currentMode: tControlModes(currentMode),
          newMode: tControlModes(newMode),
          warning: (children) => <span className="userWarning">{children}</span>,
        })}
      </div>
    </Modal>
  )
}

export default ControlModeChangeWarningModal
