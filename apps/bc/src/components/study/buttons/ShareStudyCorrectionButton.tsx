'use client'

import type { ProfessorCourseSession } from '@/db/courseSession'
import { getCourseSessionsForCorrectionSharing } from '@/services/serverFunctions/courseSession'
import CloseIcon from '@mui/icons-material/Close'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import { useFormatter, useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

interface Props {
  compact?: boolean
}

const ShareStudyCorrectionButton = ({ compact = false }: Props) => {
  const t = useTranslations('study')
  const tAction = useTranslations('common.action')
  const tCommon = useTranslations('common')
  const tSpinner = useTranslations('spinner')
  const format = useFormatter()
  const [open, setOpen] = useState(false)
  const [loading, startTransition] = useTransition()
  const [sessions, setSessions] = useState<ProfessorCourseSession[] | null>(null)
  const [sessionId, setSessionId] = useState('')
  const label = t('shareCorrection')

  const openDialog = () => {
    setOpen(true)
    setSessionId('')
    if (!loading) {
      setSessions(null)
      startTransition(async () => {
        try {
          const result = await getCourseSessionsForCorrectionSharing()
          if (result.success) {
            setSessions(result.data)
          }
        } catch (error) {
          console.error('Could not load course sessions for correction sharing', error)
        }
      })
    }
  }

  return (
    <>
      <Tooltip title={label}>
        {compact ? (
          <IconButton color="primary" aria-label={label} aria-haspopup="dialog" onClick={openDialog}>
            <ShareOutlinedIcon />
          </IconButton>
        ) : (
          <Button
            className="h100"
            variant="outlined"
            color="secondary"
            aria-label={label}
            aria-haspopup="dialog"
            onClick={openDialog}
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
        <DialogContent>
          {loading ? (
            <p role="status">{tSpinner('loading')}</p>
          ) : !sessions ? (
            <p role="alert">{tCommon('error')}</p>
          ) : sessions.length === 0 ? (
            <p role="status">{t('noCorrectionSessions')}</p>
          ) : (
            <TextField
              select
              fullWidth
              size="small"
              margin="dense"
              label={t('correctionSession')}
              value={sessionId}
              onChange={(event) => setSessionId(event.target.value)}
            >
              {sessions.map(({ id, name, startDate, endDate }) => (
                <MenuItem key={id} value={id}>
                  {name} ({format.dateTimeRange(startDate, endDate, { dateStyle: 'medium' })})
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ShareStudyCorrectionButton
