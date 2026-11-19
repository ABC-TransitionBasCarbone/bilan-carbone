'use client'

import { duplicateStudyInOtherEnvironment } from '@/services/serverFunctions/study'
import { Select } from '@abc-transitionbascarbone/common/components/base/Select'
import { useServerFunction } from '@abc-transitionbascarbone/common/components/hooks/useServerFunction'
import Modal from '@abc-transitionbascarbone/common/components/modals/Modal'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { customRich } from '@abc-transitionbascarbone/common/utils/customRich'
import { MenuItem } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

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
  const { callServerFunction } = useServerFunction()
  const router = useRouter()

  const isOtherEnvironment = useMemo(
    () => targetEnvironment !== sourceEnvironment,
    [targetEnvironment, sourceEnvironment],
  )

  const handleDuplicate = async () => {
    if (isOtherEnvironment) {
      setDuplicating(true)
      try {
        await callServerFunction(() => duplicateStudyInOtherEnvironment(studyId, targetEnvironment), {
          getSuccessMessage: () => t('duplicatedDescription', { environment: tEnv(targetEnvironment) }),
          onError: () => setDuplicating(false),
          onSuccess: () => {
            setDuplicating(false)
            onClose()
          },
        })
      } catch (error) {
        setDuplicating(false)
        throw error
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
    </>
  )
}

export default DuplicateStudyModal
