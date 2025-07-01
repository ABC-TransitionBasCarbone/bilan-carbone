'use client'

import { styled } from '@mui/material/styles'
import { useTranslations } from 'next-intl'
import Modal from './Modal'
import styles from './SiteDeselectionWarningModal.module.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  sitesWithSources: Array<{ name: string; emissionSourcesCount: number }>
}
const StyledWarningSection = styled('div')(({ theme }) => ({
  backgroundColor: theme.custom.palette.error.background,
  borderRadius: '0.5rem',
}))

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

        <StyledWarningSection className="my1 p1">
          <p className={`${styles.sitesTitle} mb-2`}>{t('affectedSites')}:</p>
          <ul className="m0 px-2">
            {sitesWithSources.map((site, index) => (
              <li key={index} className="mb-2">
                <strong>{site.name}</strong>: {t('sourcesCount', { count: site.emissionSourcesCount })}
              </li>
            ))}
          </ul>
        </StyledWarningSection>

        <p>{t('confirmation')}</p>
      </div>
    </Modal>
  )
}

export default SiteDeselectionWarningModal
