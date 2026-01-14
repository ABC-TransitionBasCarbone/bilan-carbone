'use client'

import Modal from '@/components/modals/Modal'
import { exportSpecificFields, getAllSpecificFieldsForExports } from '@/utils/study'
import { Export } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

interface Props {
  type: Export
  remainingExports: Export[]
  onConfirm: (type: Export) => void
  onCancel: (type: Export) => void
}

const ExportDeactivationWarningModal = ({ type, remainingExports, onConfirm, onCancel }: Props) => {
  const t = useTranslations('study.perimeter.exportDeactivationWarning')
  const tExport = useTranslations('exports')
  const tFields = useTranslations('emissionSource.form')

  const remainingSpecificFields = useMemo(() => getAllSpecificFieldsForExports(remainingExports), [remainingExports])

  const fields = exportSpecificFields[type].filter((field) => !remainingSpecificFields.includes(field))

  return (
    <Modal
      open
      label={`${type.toLowerCase()}-deactivation-warning`}
      title={t('title', { type: tExport(type) })}
      onClose={() => onCancel(type)}
      actions={[
        {
          actionType: 'button',
          onClick: () => onCancel(type),
          children: t('cancel'),
          ['data-testid']: 'beges-deactivation-cancel',
        },
        {
          actionType: 'button',
          onClick: () => onConfirm(type),
          children: t('continue'),
          ['data-testid']: 'beges-deactivation-confirm',
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

export default ExportDeactivationWarningModal
