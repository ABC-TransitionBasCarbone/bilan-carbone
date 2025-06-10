'use client'

import { answerFeeback, delayFeeback } from '@/services/serverFunctions/user'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Modal from '../modals/Modal'
import FeedbackModal from './FeedbackModal'

const UserFeedback = () => {
  const t = useTranslations('feedback')
  const [open, setOpen] = useState(true)
  const [displayForm, setDisplayForm] = useState(false)

  const reject = () => {
    answerFeeback()
    setOpen(false)
  }

  const delay = () => {
    delayFeeback()
    setOpen(false)
  }

  const answer = () => {
    answerFeeback()
    setDisplayForm(true)
  }

  return (
    <>
      <Modal
        label="feedback"
        open={open}
        onClose={reject}
        title={t('title')}
        actions={
          displayForm
            ? [{ actionType: 'button', children: t('close'), onClick: reject }]
            : [
                { actionType: 'button', children: t('reject'), onClick: reject },
                { actionType: 'button', children: t('delay'), onClick: delay },
                { actionType: 'button', children: t('answer'), onClick: answer },
              ]
        }
      >
        {displayForm ? <FeedbackModal /> : <>{t('body')}</>}
      </Modal>
    </>
  )
}

export default UserFeedback
