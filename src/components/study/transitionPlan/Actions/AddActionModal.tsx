import Modal from '@/components/modals/Modal'
import { useTranslations } from 'next-intl'

interface Props {
  open: boolean
  onClose: () => void
}

const AddActionModal = ({ open, onClose }: Props) => {
  const t = useTranslations('study.transitionPlan.actions')
  return (
    <Modal open={open} label="add-action-modal" onClose={onClose} title={t('add')}>
      modal content
    </Modal>
  )
}

export default AddActionModal
