'use client'

import type { ProfessorCourseSession } from '@/db/courseSession'
import { getCourseSessionsForCorrectionSharing } from '@/services/serverFunctions/courseSession'
import {
  getCorrectionStudiesForSession,
  previewCorrectionSharing,
  recordCorrectionSharing,
} from '@/services/serverFunctions/studyCorrectionSharing'
import {
  getCorrectionTargets,
  getCorrectionTargetSnapshot,
  getSessionEndingToday,
} from '@/services/studyCorrectionSharing'
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
import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import styles from './ShareStudyCorrectionButton.module.css'

type Preview = Extract<Awaited<ReturnType<typeof previewCorrectionSharing>>, { success: true }>['data']

const initialForm: {
  selectionId: string
  preview: Preview | null
  includePlan: boolean
  confirmationName: string | null
  feedback: 'changed' | 'error' | null
} = {
  selectionId: '',
  preview: null,
  includePlan: false,
  confirmationName: null,
  feedback: null,
}

const statusIcons = {
  notSent: <CloseIcon color="error" fontSize="small" />,
  withoutPlan: <DescriptionOutlinedIcon color="warning" fontSize="small" />,
  withPlan: <BarChartIcon color="success" fontSize="small" />,
}

type Props = { compact?: boolean } & (
  { studyId: string; courseSessionId?: never } | { courseSessionId: string; studyId?: never }
)

const ShareStudyCorrectionButton = ({ studyId, courseSessionId, compact = false }: Props) => {
  const t = useTranslations()
  const tSharing = useTranslations('study.correctionSharing')
  const format = useFormatter()
  const router = useRouter()
  const { showSuccessToast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, startTransition] = useTransition()
  const [options, setOptions] = useState<Pick<ProfessorCourseSession, 'id' | 'name'>[] | null>(null)
  const [form, setForm] = useState(initialForm)
  const { selectionId, preview, includePlan, confirmationName, feedback } = form
  const confirming = confirmationName !== null
  const selectId = useId()
  const confirmationId = useId()
  const label = t('study.shareCorrection')
  const recipients = preview?.recipients ?? []
  const hasMissing = recipients.some(({ status }) => status === 'notSent')
  const hasUpgrade = recipients.some(({ status }) => status === 'withoutPlan')
  const targets = getCorrectionTargets(recipients, includePlan)
  const targetIds = new Set(targets.map(({ id }) => id))

  const openDialog = () => {
    setOpen(true)
    setForm(initialForm)
    if (!loading) {
      setOptions(null)
      startTransition(async () => {
        try {
          if (courseSessionId) {
            const result = await getCorrectionStudiesForSession(courseSessionId)
            if (result.success) {
              setOptions(result.data)
            }
          } else {
            const result = await getCourseSessionsForCorrectionSharing()
            if (result.success) {
              setOptions(
                result.data.map(({ id, name, startDate, endDate }) => ({
                  id,
                  name: `${name} (${format.dateTimeRange(startDate, endDate, { dateStyle: 'medium', timeZone: 'UTC' })})`,
                })),
              )
              const session = getSessionEndingToday(result.data)
              if (session) {
                selectOption(session.id)
              }
            }
          }
        } catch (error) {
          console.error('Could not load options for correction sharing', error)
        }
      })
    }
  }

  const selectOption = (id: string) => {
    setForm({ ...initialForm, selectionId: id })
    startTransition(async () => {
      try {
        const result = await previewCorrectionSharing({
          studyId: studyId ?? id,
          courseSessionId: courseSessionId ?? id,
        })
        setForm((current) =>
          result.success ? { ...current, preview: result.data } : { ...current, feedback: 'error' },
        )
      } catch (error) {
        console.error('Could not preview correction sharing', error)
        setForm((current) => ({ ...current, feedback: 'error' }))
      }
    })
  }

  const confirm = (confirmationName: string) => {
    startTransition(async () => {
      try {
        const result = await recordCorrectionSharing({
          studyId: studyId ?? selectionId,
          courseSessionId: courseSessionId ?? selectionId,
          includePlan,
          confirmationName,
          targetSnapshot: getCorrectionTargetSnapshot(targets),
        })
        if (!result.success) {
          setForm((current) => ({ ...current, feedback: 'error' }))
          return
        }
        if (result.data.status === 'changed') {
          const { preview } = result.data
          setForm((current) => ({
            ...current,
            preview,
            includePlan: current.includePlan && preview.hasTransitionPlan,
            confirmationName: null,
            feedback: 'changed',
          }))
        } else {
          setForm((current) => ({ ...current, confirmationName: null }))
          setOpen(false)
          showSuccessToast(tSharing('recorded'))
          if (courseSessionId) {
            router.refresh()
          }
        }
      } catch (error) {
        console.error('Could not record correction sharing', error)
        setForm((current) => ({ ...current, feedback: 'error' }))
      }
    })
  }

  const actions: ModalProps['actions'] =
    confirming && preview
      ? [
          {
            children: t('common.action.back'),
            variant: 'outlined',
            disabled: loading,
            onClick: () => setForm((current) => ({ ...current, confirmationName: null })),
          },
          {
            children: tSharing('confirmSharing'),
            variant: 'contained',
            disabled: loading || confirmationName.trim() !== preview.name.trim(),
            onClick: () => confirm(confirmationName),
          },
        ]
      : targets.length > 0
        ? [
            {
              children: t('common.action.continue'),
              variant: 'contained',
              onClick: () => setForm((current) => ({ ...current, confirmationName: '', feedback: null })),
            },
          ]
        : undefined

  return (
    <>
      <Tooltip title={label}>
        {compact ? (
          <IconButton
            className={styles.compactButton}
            color="primary"
            aria-label={label}
            aria-haspopup="dialog"
            onClick={openDialog}
          >
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
        closeLabel={t('common.action.close')}
        closeDisabled={loading}
        className={styles.modal}
        actions={actions}
      >
        <Stack spacing={2} useFlexGap className={styles.fields}>
          {feedback === 'error' && <Alert severity="error">{t('common.error')}</Alert>}
          {feedback === 'changed' && <Alert severity="warning">{tSharing('changed')}</Alert>}
          {options?.length ? (
            <TextField
              id={selectId}
              select
              fullWidth
              size="small"
              disabled={loading || confirming}
              label={courseSessionId ? tSharing('selectCorrection') : t('study.correctionSession')}
              value={selectionId}
              onChange={(event) => selectOption(event.target.value)}
            >
              {options.map(({ id, name }) => (
                <MenuItem key={id} value={id}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
          ) : !loading ? (
            options ? (
              <p role="status">{courseSessionId ? tSharing('noCorrections') : t('study.noCorrectionSessions')}</p>
            ) : (
              <p role="alert">{t('common.error')}</p>
            )
          ) : null}
          {loading && <p role="status">{t('spinner.loading')}</p>}
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
              {hasUpgrade && preview.hasTransitionPlan && (includePlan || !hasMissing) && (
                <p>{tSharing('upgradeRecipients')}</p>
              )}
              {recipients.length > 0 && !hasMissing && !hasUpgrade && <p>{tSharing('alreadySent')}</p>}
              {(hasMissing || hasUpgrade) && !preview.hasTransitionPlan && <p>{tSharing('noTransitionPlan')}</p>}
              {(hasMissing || hasUpgrade) && preview.hasTransitionPlan && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includePlan}
                      onChange={(_, checked) => setForm((current) => ({ ...current, includePlan: checked }))}
                    />
                  }
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
                    onChange={(event) => {
                      const confirmationName = event.target.value
                      setForm((current) => ({ ...current, confirmationName }))
                    }}
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
