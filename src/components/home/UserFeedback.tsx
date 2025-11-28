'use client'

import { answerFeeback, delayFeeback } from '@/services/serverFunctions/user'
import { DAY, TIME_IN_MS } from '@/utils/time'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Modal from '../modals/Modal'
import FeedbackForm from './FeedbackForm'

interface Props {
  environment: Environment
}

const delayDuration = process.env.NEXT_PUBLIC_FEEDBACK_TYPEFORM_DELAY

const UserFeedback = ({ environment }: Props) => {
  const tCommon = useTranslations('feedback')
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
            ? [{ actionType: 'button', children: tCommon('close'), onClick: onClose }]
            : [
                { actionType: 'button', children: t('reject'), onClick: onClose },
                {
                  actionType: 'button',
                  children: t('delay', { time: Number(delayDuration) / (DAY * TIME_IN_MS) }),
                  onClick: delay,
                },
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
