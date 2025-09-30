'use client'

import { duplicateStudyInOtherEnvironment } from '@/services/serverFunctions/study'
import { MenuItem } from '@mui/material'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Select } from '../base/Select'
import Modal from './Modal'

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
  const [duplicating, setDuplicating] = useState(false)
  const [duplicated, setDuplicated] = useState(false)
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
        setDuplicated(true)
        setTimeout(() => {
          setDuplicating(false)
          setDuplicated(false)
          onClose()
        }, 5000)
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
    <Modal
      open={open}
      title={t(duplicated ? 'duplicatedTitle' : 'title')}
      label="duplicate-study"
      onClose={onClose}
      actions={
        duplicated
          ? []
          : [
              { actionType: 'button', onClick: onClose, children: t('cancel') },
              {
                actionType: 'loadingButton',
                onClick: handleDuplicate,
                children: t('confirm'),
                'data-testid': 'duplicate-study-confirm',
                loading: duplicating,
              },
            ]
      }
    >
      {duplicated ? (
        <div data-testid="duplicated-description">
          {t('duplicatedDescription', { environment: tEnv(targetEnvironment) })}
        </div>
      ) : (
        <>
          <span data-testid="duplication-modale-text">
            {t.rich(isOtherEnvironment ? 'otherEnvironnment' : 'description', {
              environment: tEnv(targetEnvironment),
              br: () => <br />,
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
      )}
    </Modal>
  )
}

export default DuplicateStudyModal
