'use client'

import Modal from '@/components/modals/Modal'
import { customRich } from '@/i18n/customRich'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { exportSpecificFields } from '@/utils/study'
import { Export } from '@repo/db-common'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

interface Props {
  type: Export
  hasFinalClientCaracterisation: boolean
  activeFields: (keyof UpdateEmissionSourceCommand)[]
  onConfirm: (type: Export) => void
  onCancel: (type: Export) => void
}

const ExportActivationWarningModal = ({
  type,
  hasFinalClientCaracterisation,
  activeFields,
  onConfirm,
  onCancel,
}: Props) => {
  const t = useTranslations('study.perimeter.exportActivationWarning')
  const tExport = useTranslations('exports')
  const tFields = useTranslations('emissionSource.form')

  const fields = useMemo(
    () => exportSpecificFields[type].filter((field) => !activeFields.includes(field)),
    [activeFields, type],
  )

  return (
    <Modal
      open
      label={`${type.toLowerCase()}-activation-warning`}
      title={t('title', { type: tExport(type) })}
      onClose={() => onCancel(type)}
      actions={[
        {
          actionType: 'button',
          onClick: () => onCancel(type),
          children: t('cancel'),
          ['data-testid']: 'export-activation-cancel',
        },
        {
          actionType: 'button',
          onClick: () => onConfirm(type),
          children: t('continue'),
          ['data-testid']: 'export-activation-confirm',
          color: 'error',
        },
      ]}
    >
      <div>
        <p>
          {customRich(t, 'description', {
            type: tExport(type),
            fields: fields.map((field) => tFields(field)).join(', '),
            warning: (children) => <span className="userWarning">{children}</span>,
          })}
        </p>
        {type === Export.GHGP && hasFinalClientCaracterisation && <p className="mt-2">{t('finalClientDescription')}</p>}
      </div>
    </Modal>
  )
}

export default ExportActivationWarningModal
