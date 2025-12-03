'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Modal from '../modals/Modal'

interface Props {
  emissionFactors: string[]
}

const EmissionFactorsWarning = ({ emissionFactors }: Props) => {
  const tCommon = useTranslations('common')
  const t = useTranslations('emissionFactors.missingQualities')
  const [open, setOpen] = useState(true)

  const onClose = () => {
    setOpen(false)
  }

  return (
    <>
      <Modal
        label="emission-factor-without-quality"
        open={open}
        onClose={onClose}
        title={t('title')}
        actions={[
          { actionType: 'button', children: tCommon('close'), onClick: onClose },
          { actionType: 'link', children: t('correct'), href: '/facteurs-d-emission', variant: 'contained' },
        ]}
      >
        <p>{t.rich('body', { link: (children) => <a href="/facteurs-d-emission">{children}</a> })}</p>
        <ul className="mt-2">
          {emissionFactors.map((emissionFactor) => (
            <li key={emissionFactor}>{emissionFactor}</li>
          ))}
        </ul>
      </Modal>
    </>
  )
}

export default EmissionFactorsWarning
