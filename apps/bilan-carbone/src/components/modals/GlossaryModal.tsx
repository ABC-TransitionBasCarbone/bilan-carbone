import { Translations } from '@/types/translation'
import Modal from './Modal'

interface Props {
  glossary: string
  label: string
  t: Translations
  onClose: () => void
  children: React.ReactNode
  titleParams?: Record<string, string>
}

const GlossaryModal = ({ glossary, onClose, label, t, children, titleParams }: Props) =>
  glossary && (
    <Modal
      open
      label={`${label}-glossary`}
      title={titleParams ? t(glossary, titleParams) : t(glossary)}
      onClose={onClose}
      actions={[{ actionType: 'button', onClick: onClose, children: t('close') }]}
    >
      {children}
    </Modal>
  )

export default GlossaryModal
