'use client'

import LoadingButton from '@/components/base/LoadingButton'
import Modal from '@/components/modals/Modal'
import ModalStepper from '@/components/modals/ModalStepper'
import { TrajectoryWithObjectives } from '@/db/transitionPlan'
import { useServerFunction } from '@/hooks/useServerFunction'
import {
  CreateTrajectoryInput,
  createTrajectoryWithObjectives,
  updateTrajectory,
} from '@/services/serverFunctions/trajectory'
import { createTrajectorySchema, TrajectoryFormData } from '@/services/serverFunctions/trajectory.command'
import { getDefaultObjectivesForTrajectoryType } from '@/utils/trajectory'
import { zodResolver } from '@hookform/resolvers/zod'
import { TrajectoryType } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import TrajectoryCreationStep1 from './TrajectoryCreationStep1'
import TrajectoryCreationStep2 from './TrajectoryCreationStep2'

interface Props {
  open: boolean
  onClose: () => void
  transitionPlanId: string
  onSuccess: (trajectoryId: string) => void
  trajectory: TrajectoryWithObjectives | null
}

const defaultValues: TrajectoryFormData = {
  trajectoryType: TrajectoryType.SBTI_15,
  name: '',
  description: '',
  objectives: [],
}

const TrajectoryCreationModal = ({ open, onClose, transitionPlanId, onSuccess, trajectory }: Props) => {
  const t = useTranslations('study.transitionPlan.trajectoryModal')
  const isEditMode = !!trajectory
  const [activeStep, setActiveStep] = useState(isEditMode ? 1 : 0)
  const [isLoading, setIsLoading] = useState(false)
  const { callServerFunction } = useServerFunction()

  const trajectorySchema = createTrajectorySchema()

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

  useEffect(() => {
    if (trajectory) {
      reset({
        trajectoryType: trajectory.type,
        name: trajectory.name,
        description: trajectory.description || '',
        objectives: trajectory.objectives.map((obj) => ({
          targetYear: obj.targetYear.toString(),
          reductionRate: Math.round(obj.reductionRate * 100),
        })),
      })
    }
  }, [trajectory, reset])

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

    if (isEditMode && trajectory) {
      const objectives = data.objectives
        .filter((obj) => obj.targetYear && obj.reductionRate !== null && obj.reductionRate !== undefined)
        .map((obj) => ({
          id: obj.id,
          targetYear: new Date(obj.targetYear!).getFullYear(),
          reductionRate: Number(obj.reductionRate) / 100,
        }))

      await callServerFunction(
        () =>
          updateTrajectory(trajectory.id, {
            name: data.name,
            description: data.description,
            type: data.trajectoryType,
            objectives,
          }),
        {
          onSuccess: () => {
            onSuccess(trajectory.id)
            onClose()
            reset()
            setActiveStep(isEditMode ? 1 : 0)
            setIsLoading(false)
          },
          onError: () => {
            setIsLoading(false)
          },
        },
      )
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

  if (isEditMode) {
    return (
      <Modal
        label="trajectory-edit"
        open={open}
        onClose={onClose}
        title={t('editTitle')}
        actions={[
          {
            children: t('cancel'),
            onClick: onClose,
            variant: 'outlined',
          },
          {
            actionType: 'loadingButton',
            children: t('save'),
            loading: isLoading,
            onClick: handleSubmit(onSubmit),
            disabled: !isValid,
          },
        ]}
      >
        {trajectoryType && (
          <TrajectoryCreationStep2 isSBTI={isSBTI} trajectoryType={trajectoryType} control={control} />
        )}
      </Modal>
    )
  }

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
