'use client'

import LoadingButton from '@/components/base/LoadingButton'
import ModalStepper from '@/components/modals/ModalStepper'
import { useServerFunction } from '@/hooks/useServerFunction'
import { CreateTrajectoryInput, createTrajectoryWithObjectives } from '@/services/serverFunctions/trajectory'
import { getDefaultObjectivesForTrajectoryType } from '@/utils/trajectory'
import { zodResolver } from '@hookform/resolvers/zod'
import { TrajectoryType } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import TrajectoryCreationStep1 from './TrajectoryCreationStep1'
import TrajectoryCreationStep2 from './TrajectoryCreationStep2'

interface Props {
  open: boolean
  onClose: () => void
  transitionPlanId: string
  onSuccess: (trajectoryId: string) => void
}

const createObjectiveSchema = (t: (key: string) => string) =>
  z
    .object({
      targetYear: z.string().optional().nullable(),
      reductionRate: z.number().optional().nullable(),
    })
    .refine(
      (data) => {
        const hasTargetYear = data.targetYear !== undefined && data.targetYear !== null
        const hasReductionRate = data.reductionRate !== undefined && data.reductionRate !== null
        const isEmpty = !hasTargetYear && !hasReductionRate
        const isFull = hasTargetYear && hasReductionRate
        return isEmpty || isFull
      },
      { message: t('objectiveBothRequired') },
    )

const createTrajectorySchema = (t: (key: string) => string) => {
  const objectiveSchema = createObjectiveSchema(t)
  return z
    .object({
      trajectoryType: z.nativeEnum(TrajectoryType),
      name: z.string({ required_error: t('required') }).min(1, t('required')),
      description: z.string().optional(),
      objectives: z.array(objectiveSchema),
    })
    .transform((data) => ({
      ...data,
      objectives: data.objectives.filter(
        (obj) =>
          obj.targetYear !== undefined &&
          obj.targetYear !== null &&
          obj.reductionRate !== undefined &&
          obj.reductionRate !== null,
      ),
    }))
    .refine(
      (data) => {
        if (data.trajectoryType !== TrajectoryType.CUSTOM) {
          return true
        }
        return data.objectives.length > 0
      },
      { message: t('atLeastOneObjective'), path: ['objectives'] },
    )
}
export type TrajectoryFormData = z.infer<ReturnType<typeof createTrajectorySchema>>

const defaultValues: TrajectoryFormData = {
  trajectoryType: TrajectoryType.SBTI_15,
  name: '',
  description: '',
  objectives: [],
}

const TrajectoryCreationModal = ({ open, onClose, transitionPlanId, onSuccess }: Props) => {
  const t = useTranslations('study.transitionPlan.trajectoryModal')
  const tValidation = useTranslations('study.transitionPlan.trajectoryModal.validation')
  const [activeStep, setActiveStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { callServerFunction } = useServerFunction()

  const trajectorySchema = createTrajectorySchema(tValidation)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isValid },
  } = useForm<TrajectoryFormData>({
    defaultValues,
    resolver: zodResolver(trajectorySchema),
    mode: 'onChange',
  })

  const trajectoryType = watch('trajectoryType')

  const steps = [t('steps.chooseTrajectory'), t('steps.defineObjectives')]

  const handleNext = () => {
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    reset({ ...defaultValues, trajectoryType })
    setActiveStep((prev) => prev - 1)
  }

  const handleModeSelect = (type: TrajectoryType) => {
    setValue('trajectoryType', type)
  }

  const onSubmit = async (data: TrajectoryFormData) => {
    setIsLoading(true)
    if (!data.trajectoryType) {
      setIsLoading(false)
      return
    }

    const input: CreateTrajectoryInput = {
      transitionPlanId,
      name: data.name,
      description: data.description,
      type: data.trajectoryType,
    }

    if (data.trajectoryType === TrajectoryType.CUSTOM) {
      input.objectives = data.objectives.map((obj) => ({
        targetYear: new Date(obj.targetYear!).getFullYear(),
        reductionRate: Number(obj.reductionRate) / 100,
      }))
    } else if (data.trajectoryType === TrajectoryType.SBTI_15) {
      input.objectives = getDefaultObjectivesForTrajectoryType(TrajectoryType.SBTI_15)
    } else if (data.trajectoryType === TrajectoryType.SBTI_WB2C) {
      input.objectives = getDefaultObjectivesForTrajectoryType(TrajectoryType.SBTI_WB2C)
    }

    await callServerFunction(() => createTrajectoryWithObjectives(input), {
      onSuccess: (trajectory) => {
        onSuccess(trajectory.id)
        onClose()
        reset()
        setActiveStep(0)
        setIsLoading(false)
      },
      onError: () => {
        setIsLoading(false)
      },
    })
  }

  const isSBTI = trajectoryType === TrajectoryType.SBTI_15 || trajectoryType === TrajectoryType.SBTI_WB2C
  const isStep1Valid = trajectoryType !== null

  return (
    <ModalStepper
      label="trajectory-creation"
      open={open}
      onClose={() => {
        onClose()
        reset()
        setActiveStep(0)
      }}
      title={t('title')}
      activeStep={activeStep}
      steps={steps}
      stepTitles={steps}
      onNext={activeStep === 0 ? handleNext : undefined}
      onBack={activeStep === 1 ? handleBack : undefined}
      disableNext={!isStep1Valid}
      nextButton={
        activeStep === 1 ? (
          <LoadingButton loading={isLoading} onClick={handleSubmit(onSubmit)} disabled={!isValid}>
            {t('submit')}
          </LoadingButton>
        ) : undefined
      }
    >
      {activeStep === 0 && (
        <TrajectoryCreationStep1 trajectoryType={trajectoryType} handleModeSelect={handleModeSelect} />
      )}
      {activeStep === 1 && trajectoryType && (
        <TrajectoryCreationStep2 isSBTI={isSBTI} trajectoryType={trajectoryType} control={control} />
      )}
    </ModalStepper>
  )
}

export default TrajectoryCreationModal
