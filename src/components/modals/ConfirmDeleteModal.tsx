'use client'

import { TextField, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Modal from './Modal'

interface ConfirmDeleteModalProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  requireNameMatch?: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

const ConfirmDeleteModal = ({
  open,
  title,
  message,
  confirmText = 'Supprimer',
  cancelText = 'Annuler',
  requireNameMatch,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) => {
  const t = useTranslations('common')
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
      setInputValue('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setInputValue('')
    onCancel()
  }

  const isDisabled = requireNameMatch ? inputValue !== requireNameMatch : false

  return (
    <Modal
      label="confirm-delete"
      open={open}
      onClose={handleCancel}
      title={title}
      actions={[
        {
          children: cancelText,
          onClick: handleCancel,
          disabled: isSubmitting,
        },
        {
          actionType: 'loadingButton',
          children: confirmText,
          onClick: handleConfirm,
          loading: isSubmitting,
          disabled: isDisabled,
          color: 'error',
        },
      ]}
    >
      {message && <Typography variant="body1">{message}</Typography>}
      {requireNameMatch && (
        <TextField
          autoFocus
          margin="dense"
          label={t('typeToConfirm', { name: requireNameMatch })}
          type="text"
          fullWidth
          variant="outlined"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
          }}
        />
      )}
    </Modal>
  )
}

export default ConfirmDeleteModal
