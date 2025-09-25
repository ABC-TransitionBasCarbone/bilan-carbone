'use client'

import { MenuItem } from '@mui/material'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
  const [environment, setEnvironment] = useState<Environment>(environments[0])
  const router = useRouter()

  const isOtherEnvironment = environments[0] !== sourceEnvironment

  const handleDuplicate = () => {
    if (isOtherEnvironment) {
      console.log('copy in another environment')
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
      title={t('title')}
      label="duplicate-study"
      onClose={onClose}
      actions={[
        { actionType: 'button', onClick: onClose, children: t('cancel') },
        {
          actionType: 'button',
          onClick: handleDuplicate,
          children: t('confirm'),
          'data-testid': 'duplicate-study-confirm',
        },
      ]}
    >
      {t.rich(isOtherEnvironment ? 'otherEnvironnment' : 'description', {
        environment: tEnv(environment),
        br: () => <br />,
      })}
      {environments.length > 1 && (
        <div className="flex-col my1">
          <span className="bold">{t('selectEnvironment')}</span>
          <Select
            id="environment-selector"
            value={environment}
            onChange={(event) => setEnvironment(event.target.value as Environment)}
          >
            {environments.map((environment) => (
              <MenuItem key={`environment-${environment}`} value={environment}>
                {tEnv(environment)}
              </MenuItem>
            ))}
          </Select>
        </div>
      )}
    </Modal>
  )
}

export default DuplicateStudyModal
