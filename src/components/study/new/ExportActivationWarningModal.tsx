'use client'

import Modal from '@/components/modals/Modal'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { Export } from '@prisma/client'
import { useTranslations } from 'next-intl'

interface Props {
  type: Export
  fields: (keyof UpdateEmissionSourceCommand)[]
  onConfirm: (type: Export) => void
  onCancel: (type: Export) => void
}

const ExportActivationWarningModal = ({ type, fields, onConfirm, onCancel }: Props) => {
  const t = useTranslations('study.perimeter.exportActivationWarning')
  const tExport = useTranslations('exports')
  const tFields = useTranslations('emissionSource.form')

  return (
    <Modal
      open
      label="beges-activation-warning"
      title={t('title', { type: tExport(type) })}
      onClose={() => onCancel(type)}
      actions={[
        {
          actionType: 'button',
          onClick: () => onCancel(type),
          children: t('cancel'),
          ['data-testid']: 'beges-activation-cancel',
        },
        {
          actionType: 'button',
          onClick: () => onConfirm(type),
          children: t('continue'),
          ['data-testid']: 'beges-activation-confirm',
          color: 'error',
        },
      ]}
    >
      <div>
        {t.rich('description', {
          type: tExport(type),
          fields: fields.map((field) => tFields(field)).join(', '),
          warning: (children) => <span className="userWarning">{children}</span>,
        })}
      </div>
    </Modal>
  )
}

export default ExportActivationWarningModal
