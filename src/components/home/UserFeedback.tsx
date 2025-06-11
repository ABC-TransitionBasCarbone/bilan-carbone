'use client'

import { answerFeeback, delayFeeback } from '@/services/serverFunctions/user'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Modal from '../modals/Modal'
import FeedbackForm from './FeedbackForm'

interface Props {
  environment: Environment
}

const UserFeedback = ({ environment }: Props) => {
  const t = useTranslations('feedback')
  const [open, setOpen] = useState(true)
  const [displayForm, setDisplayForm] = useState(false)

  const onClose = () => {
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
        onClose={onClose}
        title={t('title')}
        actions={
          displayForm
            ? [{ actionType: 'button', children: t('close'), onClick: onClose }]
            : [
                { actionType: 'button', children: t('reject'), onClick: onClose },
                { actionType: 'button', children: t('delay'), onClick: delay },
                { actionType: 'button', children: t('answer'), onClick: answer },
              ]
        }
      >
        {displayForm ? <FeedbackForm environment={environment} /> : <>{t('body')}</>}
      </Modal>
    </>
  )
}

export default UserFeedback
