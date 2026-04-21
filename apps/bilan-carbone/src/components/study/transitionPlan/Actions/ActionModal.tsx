import LoadingButton from '@/components/base/LoadingButton'
import Toast, { ToastColors } from '@/components/base/Toast'
import { TagFamily } from '@/components/form/ScopeSelectors'
import { OTHER_TAG_ID } from '@/components/form/TagFilter'
import ModalStepper from '@/components/modals/ModalStepper'
import { useServerFunction } from '@/hooks/useServerFunction'
import { getEnvSubPosts } from '@/services/posts'
import {
  ActionIndicatorCommand,
  AddActionFormCommand,
  createAddActionCommandValidation,
} from '@/services/serverFunctions/action.command'
import { getStudyOrganizationMembers } from '@/services/serverFunctions/study'
import { addAction, editAction } from '@/services/serverFunctions/transitionPlan'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import type { ActionWithRelations } from '@/types/trajectory.types'
import { calculatePriorityFromRelevance } from '@/utils/action'
import { objectWithoutNullAttributes } from '@/utils/object'
import { toScopedValues } from '@/utils/scope.utils'
import { convertValue } from '@/utils/study'
import { zodResolver } from '@hookform/resolvers/zod'
import { ActionIndicatorType, ActionPotentialDeduction, StudyResultUnit } from '@repo/db-common/enums'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import styles from './ActionModal.module.css'
import Step1 from './ActionModalStep1'
import Step2 from './ActionModalStep2'
import Step3 from './ActionModalStep3'

const emptyToast = { text: '', color: 'info' } as const
const toastPosition = { vertical: 'bottom', horizontal: 'left' } as const

interface Props {
  open: boolean
  action?: ActionWithRelations
  onClose: () => void
  transitionPlanId: string
  studyUnit: StudyResultUnit
  studyRealizationStartDate: string
  sites: Array<{ id: string; name: string }>
  tagFamilies: TagFamily[]
}

const ActionModal = ({
  action,
  open,
  onClose,
  transitionPlanId,
  studyUnit,
  studyRealizationStartDate,
  sites,
  tagFamilies,
}: Props) => {
  const [activeStep, setActiveStep] = useState(0)

  const [toast, setToast] = useState<{ text: string; color: ToastColors }>(emptyToast)
  const [organizationMembers, setOrganizationMembers] = useState<{ label: string; value: string }[]>([])
  const t = useTranslations('study.transitionPlan.actions.addModal')
  const tValidation = useTranslations('validation')
  const { environment } = useAppEnvironmentStore()

  const allSiteIds = useMemo(() => sites.map((s) => s.id), [sites])
  const allTagIds = useMemo(
    () => [...tagFamilies.flatMap((f) => f.tags.map((tag) => tag.id)), OTHER_TAG_ID],
    [tagFamilies],
  )
  const allEnvSubPosts = useMemo(() => getEnvSubPosts(environment), [environment])
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

  const setDefaultIndicators = useCallback((indicators: ActionIndicatorCommand[]) => {
    const defaultIndicators: ActionIndicatorCommand[] = [...indicators]
    const requiredTypes = [
      ActionIndicatorType.Implementation,
      ActionIndicatorType.FollowUp,
      ActionIndicatorType.Performance,
    ]

    requiredTypes.forEach((type) => {
      if (!indicators.some((ind) => ind.type === type)) {
        defaultIndicators.push({ type, description: '' })
      }
    })

    return defaultIndicators
  }, [])

  const convertedAction = useMemo(
    () =>
      action
        ? {
            ...objectWithoutNullAttributes(action),
            reductionValue: Math.round(
              action.reductionValueKg ? convertValue(action.reductionValueKg, StudyResultUnit.K, studyUnit) : 0,
            ),
            siteIds: action.sites.length > 0 ? action.sites.map((s) => s.studySiteId) : allSiteIds,
            tagIds: action.tags.length > 0 ? action.tags.map((t) => t.studyTagId) : allTagIds,
            subPosts: action.subPosts.length > 0 ? action.subPosts.map((sp) => sp.subPost) : allEnvSubPosts,
          }
        : {
            reductionStartYear: studyRealizationStartDate,
            siteIds: allSiteIds,
            tagIds: allTagIds,
            subPosts: allEnvSubPosts,
          },
    [action, studyUnit, studyRealizationStartDate, allSiteIds, allTagIds, allEnvSubPosts],
  )

  const { control, formState, getValues, setValue, reset, handleSubmit, trigger, setError, clearErrors } =
    useForm<AddActionFormCommand>({
      resolver: zodResolver(createAddActionCommandValidation(tagFamilies.length > 0)),
      mode: 'onChange',
      reValidateMode: 'onChange',
      defaultValues: {
        transitionPlanId,
        potentialDeduction: undefined,
        owner: '',
        nature: [],
        category: [],
        relevance: [],
        ...convertedAction,
        indicators: setDefaultIndicators(action?.indicators ?? []),
        steps: action?.steps ?? [],
      },
    })

  const potentialDeduction = useWatch({ control, name: 'potentialDeduction' })
  const reductionValue = useWatch({ control, name: 'reductionValue' })

  useEffect(() => {
    if (potentialDeduction !== ActionPotentialDeduction.Quantity) {
      clearErrors(['reductionValue'])
    }
  }, [potentialDeduction, clearErrors])

  const onSubmit = async (data: AddActionFormCommand) => {
    const cleanedIndicators = data.indicators?.filter((ind) => ind && ind.type) || []
    const cleanedSteps =
      data.steps?.filter((step) => step && step.title?.trim()).map((step, index) => ({ ...step, order: index })) || []
    const priority = calculatePriorityFromRelevance(data.relevance)
    const { reductionValue, ...dataWithoutReductionValue } = data

    const reductionValueKg = reductionValue
      ? Math.round(convertValue(reductionValue, studyUnit, StudyResultUnit.K))
      : null

    const siteIds = toScopedValues(data.siteIds ?? [], allSiteIds)
    const tagIds = toScopedValues(data.tagIds ?? [], allTagIds)
    const subPosts = toScopedValues(data.subPosts ?? [], allEnvSubPosts)

    const dataWithPriority = {
      ...dataWithoutReductionValue,
      indicators: cleanedIndicators,
      steps: cleanedSteps,
      priority,
      reductionValueKg,
      siteIds,
      tagIds,
      subPosts,
    }

    await callServerFunction(() => (action ? editAction(action.id, dataWithPriority) : addAction(dataWithPriority)), {
      onSuccess: () => {
        reset()
        setActiveStep(0)
        onClose()
        router.refresh()
      },
    })
  }

  const handleClose = () => {
    reset()
    setActiveStep(0)
    onClose()
  }

  const getRequiredFieldsForStep = (step: number): (keyof AddActionFormCommand)[] => {
    if (step === 0) {
      return [
        'title',
        'potentialDeduction',
        'reductionStartYear',
        'reductionEndYear',
        'reductionValue',
        'siteIds',
        'tagIds',
        'subPosts',
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
        disableBackdropClose
        title={t('add')}
        activeStep={activeStep}
        steps={steps}
        stepTitles={steps}
        onNext={activeStep < 2 ? handleNext : undefined}
        onBack={activeStep > 0 ? handleBack : undefined}
        disableNext={!isStepValid()}
        nextButton={
          activeStep === 2 ? (
            <LoadingButton
              onClick={() => {
                const currentValues = getValues()
                const cleanedIndicators =
                  currentValues.indicators?.filter((ind) => ind && ind.type && ind.description?.trim()) || []
                const cleanedSteps = currentValues.steps?.filter((step) => step && step.title?.trim()) || []
                setValue('indicators', cleanedIndicators)
                setValue('steps', cleanedSteps)
                handleSubmit(onSubmit)()
              }}
              loading={formState.isSubmitting}
            >
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
              sites={sites}
              tagFamilies={tagFamilies}
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
