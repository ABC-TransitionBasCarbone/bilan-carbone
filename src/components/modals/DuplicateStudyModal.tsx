'use client'

import { FullStudy } from '@/db/study'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Modal from './Modal'

interface Props {
  study: FullStudy
  open: boolean
  onClose: () => void
}

const DuplicateStudyModal = ({ study, open, onClose }: Props) => {
  const t = useTranslations('study.duplicateDialog')
  const router = useRouter()

  const handleDuplicate = () => {
    const searchParams = new URLSearchParams({
      duplicate: study.id,
    })

    if (study.organizationVersion.isCR) {
      router.push(`/organisations/${study.organizationVersionId}/etudes/creer?${searchParams.toString()}`)
    } else {
      router.push(`/etudes/creer?${searchParams.toString()}`)
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
