'use client'

import { answerFeeback, delayFeeback } from '@/services/serverFunctions/user'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Modal from '../modals/Modal'

const UserFeedback = () => {
  const t = useTranslations('feedback')
  const [open, setOpen] = useState(true)

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
    setOpen(false)
  }

  return (
    <>
      <Modal
        label="feedback"
        open={open}
        onClose={() => {}}
        title={t('title')}
        actions={[
          { actionType: 'button', children: t('reject'), onClick: reject },
          { actionType: 'button', children: t('delay'), onClick: delay },
          { actionType: 'button', children: t('answer'), onClick: answer },
        ]}
      >
        {t('body')}
      </Modal>
    </>
  )
}

export default UserFeedback
