import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import Toast, { ToastColors } from '@/components/base/Toast'
import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import Modal from '@/components/modals/Modal'
import { EngagementActionSteps, EngagementActionTargets } from '@/constants/engagementActions'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { addEngagementAction, editEngagementAction, EngagementActionWithSites } from '@/services/serverFunctions/study'
import {
  AddEngagementActionCommand,
  AddEngagementActionCommandValidation,
} from '@/services/serverFunctions/study.command'
import { objectWithoutNullAttributes } from '@/utils/object'
import { zodResolver } from '@hookform/resolvers/zod'
import { MenuItem } from '@mui/material'
import { EngagementPhase } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import styles from './EngagementActionModal.module.css'

const emptyToast = { text: '', color: 'info' } as const
const toastPosition = { vertical: 'bottom', horizontal: 'left' } as const

interface Props {
  open: boolean
  action?: EngagementActionWithSites
  onClose: () => void
  study: FullStudy
}

const EngagementActionModal = ({ action, open, onClose, study }: Props) => {
  const [toast, setToast] = useState<{ text: string; color: ToastColors }>(emptyToast)
  const t = useTranslations('study.engagementActions.modal')
  const tTargets = useTranslations('study.engagementActions.targets')
  const tSteps = useTranslations('study.engagementActions.steps')
  const tPhases = useTranslations('study.engagementActions.phases')
  const [submitting, setSubmitting] = useState(false)
  const { callServerFunction } = useServerFunction()
  const router = useRouter()

  const convertedEngagementAction = useMemo(
    () =>
      action
        ? {
            ...objectWithoutNullAttributes(action),
            date: action.date.toISOString(),
            sites: action?.sites?.map((site) => site.id) || [],
          }
        : {},
    [action],
  )

  const { control, getValues, setValue, reset, handleSubmit } = useForm<AddEngagementActionCommand>({
    resolver: zodResolver(AddEngagementActionCommandValidation),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      date: new Date().toISOString(),
      sites: [],
      ...convertedEngagementAction,
    },
  })

  const target = useWatch({ control, name: 'target' })
  const steps = useWatch({ control, name: 'steps' })
  const sites = useWatch({ control, name: 'sites' })

  const onSubmit = async () => {
    setSubmitting(true)

    await callServerFunction(
      () => (action ? editEngagementAction(action.id, getValues()) : addEngagementAction(getValues())),
      {
        onSuccess: () => {
          setSubmitting(false)
          handleClose()
          router.refresh()
        },
      },
    )
    setSubmitting(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  useEffect(() => {
    if (sites.includes('all')) {
      if (sites.length === study.sites.length + 1) {
        setValue('sites', [])
      } else {
        setValue(
          'sites',
          study.sites.map((site) => site.id),
        )
      }
    }
  }, [sites, study])

  return (
    <>
      <Modal
        open={open}
        label="add-action-modal"
        onClose={handleClose}
        title={t(action ? 'update' : 'add')}
        className={styles.actionModal}
      >
        <Form onSubmit={handleSubmit(onSubmit)} className="flex-col gapped1">
          <FormTextField
            control={control}
            name="name"
            label={`${t('name')} *`}
            placeholder={t('namePlaceholder')}
            data-testid="add-action-name"
          />
          <FormTextField
            control={control}
            name="description"
            label={`${t('description')} *`}
            placeholder={t('descriptionPlaceholder')}
            data-testid="add-action-description"
            multiline
            minRows={2}
          />
          <FormDatePicker control={control} name="date" label={`${t('date')} *`} />
          <FormAutocomplete
            data-testid="engagement-action-target"
            control={control}
            translation={t}
            options={Object.values(EngagementActionTargets).map((target) => ({
              label: tTargets(`${target}`),
              value: target,
            }))}
            inputValue={
              Object.values(EngagementActionTargets).includes(target as EngagementActionTargets)
                ? tTargets(target as string)
                : target || ''
            }
            name="target"
            label={`${t('target')} *`}
            freeSolo
            onInputChange={(_, value) => {
              setValue('target', value || '')
            }}
          />
          <FormAutocomplete
            data-testid="engagement-action-steps"
            control={control}
            translation={t}
            options={Object.values(EngagementActionSteps).map((step) => ({
              label: tSteps(`${step}`),
              value: step,
            }))}
            inputValue={
              Object.values(EngagementActionSteps).includes(steps as EngagementActionSteps)
                ? tSteps(steps as string)
                : steps || ''
            }
            name="steps"
            label={`${t('steps')} *`}
            freeSolo
            onInputChange={(_, value) => {
              setValue('steps', value || '')
            }}
          />
          <FormSelect
            data-testid="engagement-action-phase"
            control={control}
            translation={t}
            name="phase"
            label={`${t('phase')} *`}
            fullWidth
          >
            {Object.values(EngagementPhase).map((phase) => (
              <MenuItem key={phase} value={phase}>
                {tPhases(phase)}
              </MenuItem>
            ))}
          </FormSelect>
          <FormSelect
            control={control}
            translation={t}
            name={'sites'}
            label={`${t('sites')} *`}
            data-testid={`engagement-action-sites`}
            fullWidth
            multiple
            value={sites}
          >
            <MenuItem value={'all'}>{t('allSites')}</MenuItem>
            {study.sites.map((site) => (
              <MenuItem key={site.id} value={site.id}>
                {site.site.name}
              </MenuItem>
            ))}
          </FormSelect>
          <LoadingButton
            data-testid="activation-button"
            type="submit"
            loading={submitting}
            variant="contained"
            fullWidth
          >
            {t('validate')}
          </LoadingButton>
        </Form>
      </Modal>
      {toast.text && (
        <Toast
          position={toastPosition}
          onClose={() => setToast(emptyToast)}
          message={toast.text}
          color={toast.color}
          toastKey="add-action-toast"
          open
        />
      )}
    </>
  )
}

export default EngagementActionModal
