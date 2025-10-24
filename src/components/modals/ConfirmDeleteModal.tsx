'use client'

import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material'
import { useState } from 'react'
import Button from '../base/Button'
import LoadingButton from '../base/LoadingButton'

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
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
        {requireNameMatch && (
          <TextField
            autoFocus
            margin="dense"
            label={`Tapez "${requireNameMatch}" pour confirmer`}
            type="text"
            fullWidth
            variant="outlined"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={isSubmitting}>
          {cancelText}
        </Button>
        <LoadingButton
          onClick={handleConfirm}
          loading={isSubmitting}
          disabled={isDisabled}
          color="error"
          variant="contained"
        >
          {confirmText}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDeleteModal
