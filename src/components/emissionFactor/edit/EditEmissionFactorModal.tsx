import Modal from '@/components/modals/Modal'
import { deleteEmissionFactor } from '@/services/serverFunctions/emissionFactor'
import { FeFilters } from '@/types/filters'
import { handleWarningText } from '@/utils/components'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Dispatch, SetStateAction, useState } from 'react'

interface Props {
  emissionFactorId: string
  action: 'edit' | 'delete' | undefined
  setAction: (action: 'edit' | 'delete' | undefined) => void
  setFilters: Dispatch<SetStateAction<FeFilters>>
}

const EditEmissionFactorModal = ({ emissionFactorId, action, setAction, setFilters }: Props) => {
  const t = useTranslations('emissionFactors.edit.modal')
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
      setFilters((prevFilters) => ({
        ...prevFilters,
        archived: false,
        search: '',
        location: '',
      }))
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
          children: t('close'),
          ['data-testid']: `${action}-emission-factor-cancel`,
        },
        {
          actionType: 'loadingButton',
          onClick: onConfirm,
          loading: deleting,
          children: t('confirm'),
          ['data-testid']: `${action}-emission-factor-confirm`,
        },
      ]}
    >
      {handleWarningText(t, 'description')}
    </Modal>
  )
}

export default EditEmissionFactorModal
