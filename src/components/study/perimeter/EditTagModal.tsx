'use client'

import ColorPicker from '@/components/base/ColorPicker'
import { TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Modal from '../../modals/Modal'

interface Props {
  tagId: string
  currentName: string
  currentColor: string
  onSave: (tagId: string, newName: string, newColor: string) => Promise<void>
  onClose: () => void
}

const EditTagModal = ({ tagId, currentName, currentColor, onSave, onClose }: Props) => {
  const t = useTranslations('study.perimeter')
  const [color, setColor] = useState(currentColor)
  const [name, setName] = useState(currentName)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(tagId, name, color)
      onClose()
    } catch (error) {
      console.error('Failed to update tag:', error)
    } finally {
      setIsLoading(false)
      router.refresh()
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      label="edit-tag"
      title={t('editTagTitle')}
      actions={[
        { actionType: 'button', children: t('cancel'), onClick: onClose },
        { actionType: 'loadingButton', children: t('updateTag'), onClick: handleSave, loading: isLoading },
      ]}
    >
      <div className="align-start gapped2 mb1">
        <div className="flex-cc gapped1">
          <span className="inputLabel bold">{t('color')}</span>
          <ColorPicker color={color} onChange={setColor} />
        </div>
        <div className="flex-cc gapped1">
          <span className="inputLabel bold">{t('emissionSourceTagLabel')}</span>
          <TextField
            slotProps={{
              input: {
                sx: { borderRadius: '0.75rem' },
              },
            }}
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}

export default EditTagModal
