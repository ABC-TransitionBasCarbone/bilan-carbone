'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Modal from './Modal'

interface Props {
  studyId: string
  organizationVersionId: string | null
  open: boolean
  onClose: () => void
}

const DuplicateStudyModal = ({ studyId, organizationVersionId, open, onClose }: Props) => {
  const t = useTranslations('study.duplicateDialog')
  const router = useRouter()

  const handleDuplicate = () => {
    if (organizationVersionId) {
      router.push(`/organisations/${organizationVersionId}/etudes/creer?duplicate=${studyId}`)
    } else {
      router.push(`/etudes/creer?duplicate=${studyId}`)
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
      {t('description')}
    </Modal>
  )
}

export default DuplicateStudyModal
