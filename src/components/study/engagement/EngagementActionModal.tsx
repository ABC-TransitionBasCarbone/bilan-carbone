import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import Toast, { ToastColors } from '@/components/base/Toast'
import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormTextField } from '@/components/form/TextField'
import Modal from '@/components/modals/Modal'
import { EngagementActionSteps, EngagementActionTargets } from '@/constants/engagementActions'
import { useServerFunction } from '@/hooks/useServerFunction'
import { addEngagementAction, editEngagementAction } from '@/services/serverFunctions/study'
import {
  AddEngagementActionCommand,
  AddEngagementActionCommandValidation,
} from '@/services/serverFunctions/study.command'
import { objectWithoutNullAttributes } from '@/utils/object'
import { zodResolver } from '@hookform/resolvers/zod'
import { EngagementAction, EngagementPhase } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import styles from './EngagementActionModal.module.css'

const emptyToast = { text: '', color: 'info' } as const
const toastPosition = { vertical: 'bottom', horizontal: 'left' } as const

interface Props {
  open: boolean
  action?: EngagementAction
  onClose: () => void
}

const EngagementActionModal = ({ action, open, onClose }: Props) => {
  const [toast, setToast] = useState<{ text: string; color: ToastColors }>(emptyToast)
  const t = useTranslations('study.engagementActions.modal')
  const tTargets = useTranslations('study.engagementActions.targets')
  const tSteps = useTranslations('study.engagementActions.steps')
  const tPhases = useTranslations('study.engagementActions.phases')
  const [submitting, setSubmitting] = useState(false)
  const { callServerFunction } = useServerFunction()
  const params = useParams()
  const studyId = params.id as string

  const router = useRouter()

  console.log('EngagementActionModal render', { action })

  const convertedEngagementAction = useMemo(
    () =>
      action
        ? {
            ...objectWithoutNullAttributes(action),
            date: action.date.toISOString(),
          }
        : {},
    [action],
  )

  const { control, getValues, setValue, reset, handleSubmit } = useForm<AddEngagementActionCommand>({
    resolver: zodResolver(AddEngagementActionCommandValidation),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: studyId,
      steps: '',
      target: '',
      description: '',
      date: new Date().toISOString(),
      ...convertedEngagementAction,
    },
  })

  const target = useWatch({ control, name: 'target' })
  const steps = useWatch({ control, name: 'steps' })

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
            label={t('target')}
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
            label={t('steps')}
            freeSolo
            onInputChange={(_, value) => {
              setValue('steps', value || '')
            }}
          />
          <FormAutocomplete
            data-testid="engagement-action-phase"
            control={control}
            translation={t}
            options={Object.values(EngagementPhase).map((phase) => ({
              label: tPhases(`${phase}`),
              value: phase,
            }))}
            name="phase"
            label={`${t('phase')} *`}
          />
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
