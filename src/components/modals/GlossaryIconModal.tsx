'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import HelpIcon from '../base/HelpIcon'
import Modal from './Modal'

interface Props {
  title: string
  className?: string
  iconLabel: string
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
        label={t(iconLabel)}
      />
      <Modal
        open={open}
        label={`${label}-glossary`}
        title={t(title)}
        onClose={() => setOpen(false)}
        actions={[{ actionType: 'button', onClick: () => setOpen(false), children: tCommon('close') }]}
      >
        {children}
      </Modal>
    </>
  )
}

export default GlossaryIconModal
