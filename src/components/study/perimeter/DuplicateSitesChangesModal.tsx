'use client'

import Modal from '@/components/modals/Modal'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './DuplicateSiteModal.module.css'

interface Props {
  duplicate: (data: boolean) => void
}

const DuplicateSitesChangesModal = ({ duplicate }: Props) => {
  const t = useTranslations('study.perimeter.duplicate.sitesChanges')

  return (
    <Modal
      open
      label="duplicate-sites-changes"
      title={t('title')}
      onClose={() => duplicate(false)}
      actions={[
        { actionType: 'button', onClick: () => duplicate(false), children: t('no') },
        {
          actionType: 'button',
          onClick: () => duplicate(true),
          children: t('duplicate'),
          ['data-testid']: 'duplicate-sites-changes-modal-confirm',
        },
      ]}
    >
      <div className={classNames('flex-col gapped1', styles.modalContent)}>
        <p className={styles.sectionDescription}>
          {t.rich('description', {
            error: (children) => <span className="error">{children}</span>,
          })}
        </p>
      </div>
    </Modal>
  )
}

export default DuplicateSitesChangesModal
