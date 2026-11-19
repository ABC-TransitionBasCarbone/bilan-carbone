'use client'

import CloseIcon from '@mui/icons-material/Close'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface Props {
  compact?: boolean
}

const ShareStudyCorrectionButton = ({ compact = false }: Props) => {
  const t = useTranslations('study')
  const tAction = useTranslations('common.action')
  const [open, setOpen] = useState(false)
  const label = t('shareCorrection')

  return (
    <>
      <Tooltip title={label}>
        {compact ? (
          <IconButton color="primary" aria-label={label} aria-haspopup="dialog" onClick={() => setOpen(true)}>
            <ShareOutlinedIcon />
          </IconButton>
        ) : (
          <Button
            className="h100"
            variant="outlined"
            color="secondary"
            aria-label={label}
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            <ShareOutlinedIcon />
          </Button>
        )}
      </Tooltip>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="justify-between align-center gapped">
          {label}
          <IconButton aria-label={tAction('close')} onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      </Dialog>
    </>
  )
}

export default ShareStudyCorrectionButton
