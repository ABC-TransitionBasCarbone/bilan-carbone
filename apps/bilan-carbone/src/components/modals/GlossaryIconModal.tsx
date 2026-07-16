'use client'

import { HelpIcon } from '@abc-transitionbascarbone/components'
import Modal from '@abc-transitionbascarbone/components/src/modals/Modal'
import { customRich } from '@abc-transitionbascarbone/utils/customRich'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface Props {
  title: string
  className?: string
  iconLabel?: string
  label: string
  tModal: string
  children: React.ReactNode
}

const GlossaryIconModal = ({ title, className, iconLabel, label, tModal, children }: Props) => {
  const t = useTranslations(tModal)
  const tCommon = useTranslations('common')
  const [open, setOpen] = useState(false)

  return (
    <>
      <HelpIcon
        className={className}
        onClick={(e) => {
          e.preventDefault()
          setOpen((prevOpen) => !prevOpen)
        }}
        label={iconLabel ? t(iconLabel) : tCommon('moreInfo')}
      />
      <Modal
        open={open}
        label={`${label}-glossary`}
        title={customRich(t, title)}
        onClose={() => setOpen(false)}
        actions={[{ actionType: 'button', onClick: () => setOpen(false), children: tCommon('action.close') }]}
      >
        {children}
      </Modal>
    </>
  )
}

export default GlossaryIconModal
