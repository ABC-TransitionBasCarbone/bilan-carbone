import { useTranslations } from 'next-intl'
import Modal from './Modal'

interface Props {
  glossary: string
  setGlossary: (string: string) => void
  label: string
  t: ReturnType<typeof useTranslations>
}

const GlossaryModal = ({ glossary, setGlossary, label, t }: Props) =>
  glossary && (
    <Modal
      open
      label={`${label}-glossary`}
      title={t(glossary)}
      onClose={() => setGlossary('')}
      actions={[{ actionType: 'button', onClick: () => setGlossary(''), children: t('close') }]}
    >
      {t(`${glossary}Description`)}
    </Modal>
  )

export default GlossaryModal
