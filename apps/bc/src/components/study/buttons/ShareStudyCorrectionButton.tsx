'use client'

import type { ProfessorCourseSession } from '@/db/courseSession'
import { getCourseSessionsForCorrectionSharing } from '@/services/serverFunctions/courseSession'
import { previewCorrectionSharing, recordCorrectionSharing } from '@/services/serverFunctions/studyCorrectionSharing'
import { getCorrectionTargets, getCorrectionTargetSnapshot } from '@/services/studyCorrectionSharing'
import Modal, { type Props as ModalProps } from '@abc-transitionbascarbone/common/components/modals/Modal'
import { useToast } from '@abc-transitionbascarbone/common/ui'
import BarChartIcon from '@mui/icons-material/BarChart'
import CloseIcon from '@mui/icons-material/Close'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import classNames from 'classnames'
import { useFormatter, useTranslations } from 'next-intl'
import { useId, useState, useTransition } from 'react'
import styles from './ShareStudyCorrectionButton.module.css'

type Preview = Extract<Awaited<ReturnType<typeof previewCorrectionSharing>>, { success: true }>['data']

const statusIcons = {
  notSent: <CloseIcon color="error" fontSize="small" />,
  withoutPlan: <DescriptionOutlinedIcon color="warning" fontSize="small" />,
  withPlan: <BarChartIcon color="success" fontSize="small" />,
}

interface Props {
  studyId: string
  compact?: boolean
}

const ShareStudyCorrectionButton = ({ studyId, compact = false }: Props) => {
  const t = useTranslations('study')
  const tSharing = useTranslations('study.correctionSharing')
  const tAction = useTranslations('common.action')
  const tCommon = useTranslations('common')
  const tSpinner = useTranslations('spinner')
  const format = useFormatter()
  const { showSuccessToast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, startTransition] = useTransition()
  const [sessions, setSessions] = useState<ProfessorCourseSession[] | null>(null)
  const [sessionId, setSessionId] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [includePlan, setIncludePlan] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmationName, setConfirmationName] = useState('')
  const [feedback, setFeedback] = useState<'changed' | 'error' | null>(null)
  const selectId = useId()
  const confirmationId = useId()
  const label = t('shareCorrection')
  const recipients = preview?.recipients ?? []
  const hasMissing = recipients.some(({ status }) => status === 'notSent')
  const hasUpgrade = recipients.some(({ status }) => status === 'withoutPlan')
  const targets = getCorrectionTargets(recipients, includePlan)
  const targetIds = new Set(targets.map(({ id }) => id))

  const openDialog = () => {
    setOpen(true)
    setSessionId('')
    setPreview(null)
    setConfirming(false)
    setFeedback(null)
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

  const selectSession = (courseSessionId: string) => {
    setSessionId(courseSessionId)
    setIncludePlan(false)
    setPreview(null)
    setFeedback(null)
    startTransition(async () => {
      try {
        const result = await previewCorrectionSharing({ studyId, courseSessionId })
        if (result.success) {
          setPreview(result.data)
        } else {
          setFeedback('error')
        }
      } catch (error) {
        console.error('Could not preview correction sharing', error)
        setFeedback('error')
      }
    })
  }

  const confirm = () => {
    startTransition(async () => {
      try {
        const result = await recordCorrectionSharing({
          studyId,
          courseSessionId: sessionId,
          includePlan,
          confirmationName,
          targetSnapshot: getCorrectionTargetSnapshot(targets),
        })
        if (!result.success) {
          setFeedback('error')
          return
        }
        setConfirming(false)
        if (result.data.status === 'changed') {
          setPreview(result.data.preview)
          setFeedback('changed')
        } else {
          setOpen(false)
          showSuccessToast(tSharing('recorded'))
        }
      } catch (error) {
        console.error('Could not record correction sharing', error)
        setFeedback('error')
      }
    })
  }

  const actions: ModalProps['actions'] =
    confirming && preview
      ? [
          { children: tAction('back'), variant: 'outlined', disabled: loading, onClick: () => setConfirming(false) },
          {
            children: tSharing('confirmSharing'),
            variant: 'contained',
            disabled: loading || confirmationName.trim() !== preview.name.trim(),
            onClick: confirm,
          },
        ]
      : targets.length > 0
        ? [
            {
              children: tAction('continue'),
              variant: 'contained',
              onClick: () => {
                setConfirmationName('')
                setFeedback(null)
                setConfirming(true)
              },
            },
          ]
        : undefined

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
      <Modal
        label={`share-study-correction-${selectId}`}
        title={label}
        open={open}
        onClose={() => setOpen(false)}
        closeLabel={tAction('close')}
        closeDisabled={loading}
        className={styles.modal}
        actions={actions}
      >
        <Stack spacing={2} useFlexGap className={styles.fields}>
          {feedback === 'error' && <Alert severity="error">{tCommon('error')}</Alert>}
          {feedback === 'changed' && <Alert severity="warning">{tSharing('changed')}</Alert>}
          {sessions?.length ? (
            <TextField
              id={selectId}
              select
              fullWidth
              size="small"
              disabled={loading || confirming}
              label={t('correctionSession')}
              value={sessionId}
              onChange={(event) => selectSession(event.target.value)}
            >
              {sessions.map(({ id, name, startDate, endDate }) => (
                <MenuItem key={id} value={id}>
                  {name} ({format.dateTimeRange(startDate, endDate, { dateStyle: 'medium' })})
                </MenuItem>
              ))}
            </TextField>
          ) : !loading ? (
            sessions ? (
              <p role="status">{t('noCorrectionSessions')}</p>
            ) : (
              <p role="alert">{tCommon('error')}</p>
            )
          ) : null}
          {loading && <p role="status">{tSpinner('loading')}</p>}
          {preview && (
            <>
              {recipients.length ? (
                <ul className={styles.recipients} aria-label={tSharing('recipients')}>
                  {recipients.map(({ id, firstName, lastName, status }) => {
                    const targeted = confirming && targetIds.has(id)
                    return (
                      <li key={id}>
                        <Tooltip
                          title={`${firstName} ${lastName} — ${tSharing(status)}${targeted ? ` · ${tSharing('targeted')}` : ''}`}
                        >
                          <span tabIndex={0} className={classNames(styles.recipient, { [styles.targeted]: targeted })}>
                            {statusIcons[status]}
                            {firstName} {lastName ? `${lastName.charAt(0).toLocaleUpperCase()}.` : ''}
                          </span>
                        </Tooltip>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p>{tSharing('noTrainees')}</p>
              )}
              {hasMissing && <p>{tSharing('missingRecipients')}</p>}
              {hasUpgrade && (includePlan || !hasMissing) && <p>{tSharing('upgradeRecipients')}</p>}
              {recipients.length > 0 && !hasMissing && !hasUpgrade && <p>{tSharing('alreadySent')}</p>}
              {(hasMissing || hasUpgrade) && (
                <FormControlLabel
                  control={<Checkbox checked={includePlan} onChange={(_, checked) => setIncludePlan(checked)} />}
                  disabled={loading || confirming}
                  label={tSharing('withPlanChoice')}
                />
              )}
              {confirming && (
                <Stack component="section" spacing={2} useFlexGap className={styles.confirmation}>
                  <h3>{tSharing('confirmTitle')}</h3>
                  <p>
                    {tSharing(includePlan ? 'confirmWithPlan' : 'confirmWithoutPlan', {
                      session: preview.name,
                      count: targets.length,
                    })}
                  </p>
                  <Alert severity="error">{tSharing('sharingWarning')}</Alert>
                  <TextField
                    id={confirmationId}
                    fullWidth
                    label={tSharing('sessionName')}
                    value={confirmationName}
                    disabled={loading}
                    onChange={(event) => setConfirmationName(event.target.value)}
                  />
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Modal>
    </>
  )
}

export default ShareStudyCorrectionButton
