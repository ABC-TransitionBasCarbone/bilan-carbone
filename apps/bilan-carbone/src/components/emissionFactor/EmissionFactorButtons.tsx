'use client'

import LinkButton from '@/components/base/LinkButton'
import { useToast } from '@/components/base/ToastProvider'
import { Button } from '@mui/material'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useState } from 'react'

const ImportEmissionFactorsModal = dynamic(() => import('./ImportEmissionFactorsModal'))

interface Props {
  addHref: string
}

const EmissionFactorButtons = ({ addHref }: Props) => {
  const t = useTranslations('emissionFactors')
  const { showSuccessToast } = useToast()
  const [open, setOpen] = useState(false)

  const handleClose = () => setOpen(false)

  const handleSuccess = () => {
    setOpen(false)
    showSuccessToast(t('importModal.success'))
  }

  return (
    <>
      <div className="flex gapped1 align-center">
        <LinkButton variant="contained" href={addHref}>
          {t('add')}
        </LinkButton>

        <Button variant="outlined" onClick={() => setOpen(true)}>
          {t('import')}
        </Button>
      </div>
      {open && <ImportEmissionFactorsModal open={open} onClose={handleClose} onSuccess={handleSuccess} />}
    </>
  )
}

export default EmissionFactorButtons
