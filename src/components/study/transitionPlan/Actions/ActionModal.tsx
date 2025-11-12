import LoadingButton from '@/components/base/LoadingButton'
import Toast, { ToastColors } from '@/components/base/Toast'
import ModalStepper from '@/components/modals/ModalStepper'
import { useServerFunction } from '@/hooks/useServerFunction'
import { getStudyOrganizationMembers } from '@/services/serverFunctions/study'
import { addAction, editAction } from '@/services/serverFunctions/transitionPlan'
import { AddActionCommand, AddActionCommandValidation } from '@/services/serverFunctions/transitionPlan.command'
import { calculatePriorityFromRelevance } from '@/utils/action'
import { objectWithoutNullAttributes } from '@/utils/object'
import { zodResolver } from '@hookform/resolvers/zod'
import { Action, ActionPotentialDeduction } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import styles from './ActionModal.module.css'
import Step1 from './ActionModalStep1'
import Step2 from './ActionModalStep2'
import Step3 from './ActionModalStep3'

const emptyToast = { text: '', color: 'info' } as const
const toastPosition = { vertical: 'bottom', horizontal: 'left' } as const

interface Props {
  open: boolean
  action?: Action
  onClose: () => void
  transitionPlanId: string
  studyUnit: string
}

const ActionModal = ({ action, open, onClose, transitionPlanId, studyUnit }: Props) => {
  const [activeStep, setActiveStep] = useState(0)
  const [toast, setToast] = useState<{ text: string; color: ToastColors }>(emptyToast)
  const [organizationMembers, setOrganizationMembers] = useState<{ label: string; value: string }[]>([])
  const t = useTranslations('study.transitionPlan.actions.addModal')
  const tValidation = useTranslations('validation')
  const { callServerFunction } = useServerFunction()
  const params = useParams()
  const studyId = params.id as string

  const router = useRouter()

  useEffect(() => {
    if (open && studyId) {
      callServerFunction(() => getStudyOrganizationMembers(studyId), {
        onSuccess: (result) => {
          const members = result.map((member) => ({
            label: `${member.user.firstName} ${member.user.lastName.toUpperCase()}`,
            value: `${member.user.firstName} ${member.user.lastName.toUpperCase()}`,
          }))
          setOrganizationMembers(members)
        },
      })
    }
  }, [open, studyId, callServerFunction])

  const { control, formState, getValues, setValue, reset, handleSubmit, trigger, setError, clearErrors } =
    useForm<AddActionCommand>({
      resolver: zodResolver(AddActionCommandValidation),
      mode: 'onChange',
      reValidateMode: 'onChange',
      defaultValues: {
        transitionPlanId,
        potentialDeduction: undefined,
        owner: '',
        nature: [],
        category: [],
        relevance: [],
        dependenciesOnly: false,
        ...objectWithoutNullAttributes(action),
      },
    })

  const potentialDeduction = useWatch({ control, name: 'potentialDeduction' })
  const reductionValue = useWatch({ control, name: 'reductionValue' })

  useEffect(() => {
    if (potentialDeduction !== ActionPotentialDeduction.Quantity) {
      clearErrors(['reductionValue'])
    }
  }, [potentialDeduction, clearErrors])

  const onSubmit = async (data: AddActionCommand) => {
    const priority = calculatePriorityFromRelevance(data.relevance)
    const dataWithPriority = { ...data, priority }

    const res = action ? await editAction(action.id, dataWithPriority) : await addAction(dataWithPriority)
    if (res.success) {
      reset()
      setActiveStep(0)
      onClose()
      router.refresh()
    } else {
      setToast({ text: t(res.errorMessage), color: 'error' })
    }
  }

  const handleClose = () => {
    reset()
    setActiveStep(0)
    onClose()
  }

  const getRequiredFieldsForStep = (step: number): (keyof AddActionCommand)[] => {
    if (step === 0) {
      return [
        'title',
        'subSteps',
        'detailedDescription',
        'potentialDeduction',
        'reductionStartYear',
        'reductionEndYear',
        'reductionValue',
      ]
    }
    return []
  }

  const handleNext = async () => {
    const fieldsToValidate = getRequiredFieldsForStep(activeStep)
    let isValid = await trigger(fieldsToValidate)

    if (activeStep === 0) {
      if (potentialDeduction === ActionPotentialDeduction.Quantity) {
        if (!reductionValue) {
          setError('reductionValue', { message: tValidation('required') })
          isValid = false
          return
        }
      }
    }

    if (!isValid) {
      return
    }

    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  const isStepValid = () => {
    const fieldsToValidate = getRequiredFieldsForStep(activeStep)
    if (fieldsToValidate.length === 0) {
      return true
    }
    return fieldsToValidate.every((field) => !formState.errors[field])
  }

  const steps = [t('steps.step1'), t('steps.step2'), t('steps.step3')]

  return (
    <>
      <ModalStepper
        open={open}
        label="add-action-modal"
        onClose={handleClose}
        title={t('add')}
        activeStep={activeStep}
        steps={steps}
        stepTitles={steps}
        onNext={activeStep < 2 ? handleNext : undefined}
        onBack={activeStep > 0 ? handleBack : undefined}
        disableNext={!isStepValid()}
        nextButton={
          activeStep === 2 ? (
            <LoadingButton onClick={handleSubmit(onSubmit)} loading={formState.isSubmitting}>
              {t(action ? 'update' : 'add')}
            </LoadingButton>
          ) : undefined
        }
        nextLabel={t('next')}
        backLabel={t('previous')}
        className={styles.actionModal}
      >
        <div className={classNames('flex-col gapped1', styles.stepContent)}>
          {activeStep === 0 && (
            <Step1
              studyUnit={studyUnit}
              control={control}
              setValue={setValue}
              getValues={getValues}
              errors={formState.errors}
            />
          )}
          {activeStep === 1 && <Step2 control={control} />}
          {activeStep === 2 && (
            <Step3 organizationMembers={organizationMembers} control={control} setValue={setValue} />
          )}
        </div>
      </ModalStepper>
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

export default ActionModal
