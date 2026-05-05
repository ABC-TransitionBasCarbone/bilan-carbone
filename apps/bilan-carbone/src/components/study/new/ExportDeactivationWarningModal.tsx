'use client'

import Modal from '@/components/modals/Modal'
import { customRich } from '@/i18n/customRich'
import { exportSpecificFields, getAllSpecificFieldsForExports } from '@/utils/study'
import { Export } from '@abc-transitionbascarbone/db-common/enums'
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
          ['data-testid']: 'export-deactivation-cancel',
        },
        {
          actionType: 'button',
          onClick: () => onConfirm(type),
          children: t('continue'),
          ['data-testid']: 'export-deactivation-confirm',
          color: 'error',
        },
      ]}
    >
      <div>
        {customRich(t, 'description', {
          type: tExport(type),
          fields: fields.map((field) => tFields(field)).join(', '),
          warning: (children) => <span className="userWarning">{children}</span>,
          additionnalInfos: type === Export.GHGP ? t('ghgpDeactivationAdditionnalInfos') : '',
        })}
      </div>
    </Modal>
  )
}

export default ExportDeactivationWarningModal
