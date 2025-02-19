import { useTranslations } from 'next-intl'
import Modal from './Modal'

interface Props {
  glossary: string
  label: string
  t: ReturnType<typeof useTranslations>
  onClose: () => void
  children: React.ReactNode
}

const GlossaryModal = ({ glossary, onClose, label, t, children }: Props) =>
  glossary && (
    <Modal
      open
      label={`${label}-glossary`}
      title={t(glossary)}
      onClose={onClose}
      actions={[{ actionType: 'button', onClick: onClose, children: t('close') }]}
    >
      {children}
    </Modal>
  )

export default GlossaryModal
