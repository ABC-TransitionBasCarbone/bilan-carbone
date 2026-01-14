'use client'

import Modal from '@/components/modals/Modal'
import { customRich } from '@/i18n/customRich'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './DuplicateSiteModal.module.css'

interface Props {
  replicate: (data: boolean) => void
}

const ReplicateSitesChangesModal = ({ replicate }: Props) => {
  const t = useTranslations('study.perimeter.duplicate.sitesChanges')

  return (
    <Modal
      open
      label="replicate-sites-changes"
      title={t('title')}
      onClose={() => replicate(false)}
      actions={[
        { actionType: 'button', onClick: () => replicate(false), children: t('no') },
        {
          actionType: 'button',
          onClick: () => replicate(true),
          children: t('replicate'),
          ['data-testid']: 'replicate-sites-changes-modal-confirm',
        },
      ]}
    >
      <div className={classNames('flex-col gapped1', styles.modalContent)}>
        <p className={styles.sectionDescription}>{customRich(t, 'description')}</p>
      </div>
    </Modal>
  )
}

export default ReplicateSitesChangesModal
