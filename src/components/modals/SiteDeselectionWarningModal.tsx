'use client'

import { useTranslations } from 'next-intl'
import Modal from './Modal'
import styles from './SiteDeselectionWarningModal.module.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  sitesWithSources: Array<{ name: string; emissionSourcesCount: number }>
}

const SiteDeselectionWarningModal = ({ isOpen, onClose, onConfirm, sitesWithSources }: Props) => {
  const t = useTranslations('study.new.siteDeselectionModal')

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t('title')}
      label="site-deselection-warning"
      actions={[
        {
          actionType: 'button',
          children: t('cancel'),
          onClick: onClose,
        },
        {
          actionType: 'button',
          color: 'error',
          children: t('proceed'),
          onClick: onConfirm,
        },
      ]}
    >
      <div>
        <p>{t('description')}</p>

        <div className={styles.sitesSection}>
          <p className={styles.sitesTitle}>{t('affectedSites')}:</p>
          <ul className={styles.sitesList}>
            {sitesWithSources.map((site, index) => (
              <li key={index} className={styles.siteItem}>
                <strong>{site.name}</strong>: {t('sourcesCount', { count: site.emissionSourcesCount })}
              </li>
            ))}
          </ul>
        </div>

        <p>{t('confirmation')}</p>
      </div>
    </Modal>
  )
}

export default SiteDeselectionWarningModal
