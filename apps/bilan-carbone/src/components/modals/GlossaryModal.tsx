import { Translations } from '@abc-transitionbascarbone/lib'
import { useTranslations } from 'next-intl'
import Modal from './Modal'

interface Props {
  glossary: string
  label: string
  t: Translations
  onClose: () => void
  children: React.ReactNode
  titleParams?: Record<string, string>
}

const GlossaryModal = ({ glossary, onClose, label, t, children, titleParams }: Props) => {
  const tCommon = useTranslations('common')

  return glossary ? (
    <Modal
      open
      label={`${label}-glossary`}
      title={titleParams ? t(glossary, titleParams) : t(glossary)}
      onClose={onClose}
      actions={[{ actionType: 'button', onClick: onClose, children: tCommon('action.close') }]}
    >
      {children}
    </Modal>
  ) : null
}

export default GlossaryModal
