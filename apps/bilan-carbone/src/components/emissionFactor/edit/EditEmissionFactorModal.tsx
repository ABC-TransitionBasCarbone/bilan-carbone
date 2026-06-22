import { deleteEmissionFactor } from '@/services/serverFunctions/emissionFactor'
import { handleWarningText } from '@/utils/components'
import Modal from '@abc-transitionbascarbone/components/src/modals/Modal'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  emissionFactorId: string
  action: 'edit' | 'delete' | undefined
  setAction: (action: 'edit' | 'delete' | undefined) => void
  onDelete: () => void
}

const EditEmissionFactorModal = ({ emissionFactorId, action, setAction, onDelete }: Props) => {
  const t = useTranslations('emissionFactors.edit.modal')
  const tCommon = useTranslations('common')

  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const onCancel = () => setAction(undefined)
  const onConfirm = async () => {
    if (action === 'edit') {
      router.push(`/facteurs-d-emission/${emissionFactorId}/modifier`)
    } else if (action === 'delete') {
      setDeleting(true)
      await deleteEmissionFactor(emissionFactorId)
      setDeleting(false)
      setAction(undefined)
      onDelete()
      router.refresh()
    }
  }

  return (
    <Modal
      open={!!action}
      label={`${action}-emission-factor`}
      title={t(`confirm-${action === 'edit' ? 'edition' : 'deletion'}`)}
      onClose={onCancel}
      actions={[
        {
          actionType: 'button',
          onClick: onCancel,
          children: tCommon('action.cancel'),
          ['data-testid']: `${action}-emission-factor-cancel`,
        },
        {
          actionType: 'loadingButton',
          onClick: onConfirm,
          loading: deleting,
          children: tCommon('action.confirm'),
          ['data-testid']: `${action}-emission-factor-confirm`,
        },
      ]}
    >
      {handleWarningText(t, 'description')}
    </Modal>
  )
}

export default EditEmissionFactorModal
