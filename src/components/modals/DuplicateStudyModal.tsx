'use client'

import { customRich } from '@/i18n/customRich'
import { duplicateStudyInOtherEnvironment } from '@/services/serverFunctions/study'
import { MenuItem } from '@mui/material'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Select } from '../base/Select'
import Toast, { ToastColors } from '../base/Toast'
import Modal from './Modal'

const emptyToast = { text: '', color: 'info' } as const
const toastPosition = { vertical: 'bottom', horizontal: 'left' } as const

interface Props {
  studyId: string
  organizationVersionId: string | null
  environments: Environment[]
  sourceEnvironment: Environment
  open: boolean
  onClose: () => void
}

const DuplicateStudyModal = ({
  studyId,
  organizationVersionId,
  open,
  onClose,
  environments,
  sourceEnvironment,
}: Props) => {
  const t = useTranslations('study.duplicateDialog')
  const tEnv = useTranslations('environment')
  const [targetEnvironment, setTargetEnvironment] = useState<Environment>(environments[0])
  const [toast, setToast] = useState<{ text: string; color: ToastColors }>(emptyToast)
  const [duplicating, setDuplicating] = useState(false)
  const router = useRouter()

  const isOtherEnvironment = useMemo(
    () => targetEnvironment !== sourceEnvironment,
    [targetEnvironment, sourceEnvironment],
  )

  const handleDuplicate = async () => {
    if (isOtherEnvironment) {
      setDuplicating(true)
      const res = await duplicateStudyInOtherEnvironment(studyId, targetEnvironment)
      if (res.success) {
        setDuplicating(false)
        onClose()
        setToast({ text: t('duplicatedDescription', { environment: tEnv(targetEnvironment) }), color: 'success' })
      }
    } else {
      if (organizationVersionId) {
        router.push(`/organisations/${organizationVersionId}/etudes/creer?duplicate=${studyId}`)
      } else {
        router.push(`/etudes/creer?duplicate=${studyId}`)
      }
    }
  }

  return (
    <>
      <Modal
        open={open}
        title={t('title')}
        label="duplicate-study"
        onClose={onClose}
        actions={[
          { actionType: 'button', onClick: onClose, children: t('cancel') },
          {
            actionType: 'loadingButton',
            onClick: handleDuplicate,
            children: t('confirm'),
            'data-testid': 'duplicate-study-confirm',
            loading: duplicating,
          },
        ]}
      >
        <>
          <span data-testid="duplication-modale-text">
            {customRich(t, isOtherEnvironment ? 'otherEnvironnment' : 'description', {
              environment: tEnv(targetEnvironment),
            })}
          </span>
          {environments.length > 1 && (
            <div className="flex-col my1">
              <span className="bold mb-2">{t('selectEnvironment')}</span>
              <Select
                id="environment-selector"
                data-testid="environment-selector"
                value={targetEnvironment}
                onChange={(event) => setTargetEnvironment(event.target.value as Environment)}
              >
                {environments.map((environment) => (
                  <MenuItem key={`environment-${environment}`} value={environment}>
                    {tEnv(environment)}
                  </MenuItem>
                ))}
              </Select>
            </div>
          )}
        </>
      </Modal>
      {toast.text && (
        <Toast
          position={toastPosition}
          onClose={() => setToast(emptyToast)}
          message={toast.text}
          color={toast.color}
          toastKey="duplicate-study-toast"
          open
        />
      )}
    </>
  )
}

export default DuplicateStudyModal
