import Button from '@/components/base/Button'
import LoadingButton from '@/components/base/LoadingButton'
import { deleteEmissionFactor } from '@/services/serverFunctions/emissionFactor'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  emissionFactorId: string
  action: 'edit' | 'delete' | undefined
  setAction: (action: 'edit' | 'delete' | undefined) => void
}

const EditEmissionFactorModal = ({ emissionFactorId, action, setAction }: Props) => {
  const t = useTranslations('emissionFactors.edit.modal')
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const onCancel = () => setAction(undefined)
  const onConfirm = () => {
    if (action === 'edit') {
      router.push(`/facteurs-d-emission/${emissionFactorId}/modifier`)
    } else if (action === 'delete') {
      setDeleting(true)
      deleteEmissionFactor(emissionFactorId)
      setDeleting(false)
      setAction(undefined)
      router.refresh()
    }
  }

  const title = `confirm-${action === 'edit' ? 'edition' : 'deletion'}`
  const label = `${action}-emission-factor-dialog`

  return (
    <Dialog open={!!action} aria-labelledby={`${label}-title`} aria-describedby={`${label}-description`}>
      <DialogTitle id={`${label}-title`}>{t(title)}</DialogTitle>
      <DialogContent>{t('description')}</DialogContent>
      <DialogActions>
        <Button data-testid={`${label}-cancel`} onClick={onCancel}>
          {t('close')}
        </Button>
        <LoadingButton data-testid={`${label}-confirm`} onClick={onConfirm} loading={deleting}>
          {t('confirm')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}

export default EditEmissionFactorModal
