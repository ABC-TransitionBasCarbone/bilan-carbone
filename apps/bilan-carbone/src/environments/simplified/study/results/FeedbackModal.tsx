import { appendForm } from '@/utils/form'
import Modal from '@/components/modals/Modal'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

const typeformId = process.env.NEXT_PUBLIC_RESULTS_FEEDBACK_TYPEFORM_ID
interface Props {
  user: UserSession
  organizationName: string
  open: boolean
  setOpen: (open: boolean) => void
}
const FeedbackModal = ({ user, organizationName, open, setOpen }: Props) => {
  const tResults = useTranslations('study.results')

  const params = {
    name: user.lastName.toUpperCase(),
    firstname: user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase(),
    email: user.email,
    organization: organizationName,
  }
  useEffect(() => {
    appendForm()
  }, [])

  return (
    <Modal
      open={open}
      label="feedback"
      title={tResults('feedback.title')}
      onClose={() => setOpen(false)}
    >

      <div
        className="typeform"
        data-tf-live={typeformId}
        data-tf-hidden={[
          `name=${params.name}`,
          `firstname=${params.firstname}`,
          `email=${params.email}`,
          `organization=${params.organization}`,
        ].join(',')}
      />
    </Modal>
  )
}

export default FeedbackModal
