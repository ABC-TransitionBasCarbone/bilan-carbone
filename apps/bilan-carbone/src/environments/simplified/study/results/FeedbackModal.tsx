import { appendForm } from '@/utils/form'
import Modal from '@abc-transitionbascarbone/components/src/modals/Modal'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

const typeformId = process.env.NEXT_PUBLIC_RESULTS_FEEDBACK_TYPEFORM_ID
interface Props {
  open: boolean
  setOpen: (open: boolean) => void
}
const FeedbackModal = ({ open, setOpen }: Props) => {
  const tResults = useTranslations('study.results')

  useEffect(() => {
    appendForm()
  }, [])

  return (
    <Modal open={open} label="feedback" title={tResults('feedback.title')} onClose={() => setOpen(false)}>
      <div className="typeform" data-tf-live={typeformId} />
    </Modal>
  )
}

export default FeedbackModal
