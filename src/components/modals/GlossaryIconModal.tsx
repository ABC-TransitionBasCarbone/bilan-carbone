'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import HelpIcon from '../base/HelpIcon'
import Modal from './Modal'

interface Props {
  title: string
  className: string
  iconLabel: string
  label: string
  tModal: string
  children: React.ReactNode
}

const GlossaryIconModal = ({ title, className, iconLabel, label, tModal, children }: Props) => {
  const t = useTranslations(tModal)
  const [open, setOpen] = useState(false)

  const onClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      e.preventDefault()
      e.stopPropagation()
      setOpen((prevOpen) => !prevOpen)
    },
    [setOpen],
  )

  return (
    <>
      <HelpIcon className={className} onClick={onClick} label={t(iconLabel)} />
      <Modal
        open={open}
        label={`${label}-glossary`}
        title={t(title)}
        onClose={() => setOpen(false)}
        actions={[{ actionType: 'button', onClick: () => setOpen(false), children: t('close') }]}
      >
        {children}
      </Modal>
    </>
  )
}

export default GlossaryIconModal
