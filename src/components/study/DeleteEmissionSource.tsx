'use client'

import Button from '@/components/base/Button'
import { FullStudy } from '@/db/study'
import { deleteEmissionSource } from '@/services/serverFunctions/emissionSource'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button as MUIButton,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

interface Props {
  emissionSource: FullStudy['emissionSources'][0]
}

const DeleteEmissionSource = ({ emissionSource }: Props) => {
  const t = useTranslations('emissionSource.deleteDialog')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [disabled, setDisabled] = useState(false)

  const onAccept = useCallback(async () => {
    try {
      setDisabled(true)
      await deleteEmissionSource(emissionSource.id)
      router.refresh()
    } finally {
      setDisabled(false)
    }
  }, [emissionSource])

  return (
    <>
      <Dialog
        open={open}
        aria-labelledby="delete-emission-source-dialog-title"
        aria-describedby="delete-emission-source-dialog-description"
      >
        <DialogTitle id="delete-emission-source-dialog-title">{t('title')}</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-emission-source-dialog-description">{t('description')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={disabled} onClick={() => setOpen(false)}>
            {t('decline')}
          </Button>
          <Button disabled={disabled} onClick={onAccept} data-testid="delete-emission-source-dialog-accept">
            {t('accept')}
          </Button>
        </DialogActions>
      </Dialog>
      <MUIButton
        data-testid="emission-source-delete"
        onClick={() => setOpen(true)}
        variant="contained"
        color="error"
        aria-label={t('delete')}
        title={t('delete')}
      >
        <DeleteIcon />
      </MUIButton>
    </>
  )
}

export default DeleteEmissionSource
