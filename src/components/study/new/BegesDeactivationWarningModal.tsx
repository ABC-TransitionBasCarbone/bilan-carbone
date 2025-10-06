'use client'

import Modal from '@/components/modals/Modal'
import { useTranslations } from 'next-intl'

interface Props {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

const BegesDeactivationWarningModal = ({ open, onConfirm, onCancel }: Props) => {
  const t = useTranslations('study.perimeter.begesDeactivationWarning')

  return (
    <Modal
      open={open}
      label="beges-deactivation-warning"
      title={t('title')}
      onClose={onCancel}
      actions={[
        {
          actionType: 'button',
          onClick: onCancel,
          children: t('cancel'),
          ['data-testid']: 'beges-deactivation-cancel',
        },
        {
          actionType: 'button',
          onClick: onConfirm,
          children: t('continue'),
          ['data-testid']: 'beges-deactivation-confirm',
          color: 'error',
        },
      ]}
    >
      <div>
        {t.rich('description', {
          warning: (children) => <span className="userWarning">{children}</span>,
        })}
      </div>
    </Modal>
  )
}

export default BegesDeactivationWarningModal
