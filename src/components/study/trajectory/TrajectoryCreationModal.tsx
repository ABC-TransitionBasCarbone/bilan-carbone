'use client'

import LoadingButton from '@/components/base/LoadingButton'
import Modal from '@/components/modals/Modal'
import { TrajectoryWithObjectives } from '@/db/transitionPlan'
import { useServerFunction } from '@/hooks/useServerFunction'
import {
  CreateTrajectoryInput,
  createTrajectoryWithObjectives,
  updateTrajectory,
} from '@/services/serverFunctions/trajectory'
import { createTrajectorySchema, TrajectoryFormData } from '@/services/serverFunctions/trajectory.command'
import { calculateSNBCReductionRates, getSNBCGeneralDisplayedReductionRates } from '@/utils/snbc'
import { getYearFromDateStr } from '@/utils/time'
import {
  BaseObjective,
  getCorrectedObjectives,
  getDefaultObjectivesForTrajectoryType,
  getDisplayedReferenceYearForTrajectoryType,
  getReductionRatePerType,
  PastStudy,
  SBTI_START_YEAR,
} from '@/utils/trajectory'
import { zodResolver } from '@hookform/resolvers/zod'
import { SectenInfo, TrajectoryType } from '@prisma/client'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import TrajectoryCreationStep2 from './TrajectoryCreationStep2'

const TrajectoryCreationStep1 = dynamic(() => import('./TrajectoryCreationStep1'), { ssr: false })
const ModalStepper = dynamic(() => import('@/components/modals/ModalStepper'), { ssr: false })

interface Props {
  open: boolean
  onClose: () => void
  transitionPlanId: string
  onSuccess: (trajectoryId: string) => void
  trajectory: TrajectoryWithObjectives | null
  isFirstCreation?: boolean
  studyYear: number
  sectenData: SectenInfo[]
  studyEmissions?: number
  pastStudies?: PastStudy[]
}

const defaultValues: TrajectoryFormData = {
  trajectoryType: TrajectoryType.SBTI_15,
  name: '',
  description: '',
  referenceYear: SBTI_START_YEAR.toString(),
  objectives: Array.from({ length: 2 }).map(() => ({
    targetYear: null,
    reductionRate: null,
  })),
}

const TrajectoryCreationModal = ({
  open,
  onClose,
  transitionPlanId,
  onSuccess,
  trajectory,
  isFirstCreation = true,
  studyYear,
  sectenData,
  studyEmissions = 0,
  pastStudies = [],
}: Props) => {
  const t = useTranslations('study.transitionPlan.trajectoryModal')
  const isEditMode = !!trajectory
  const [activeStep, setActiveStep] = useState(isEditMode || !isFirstCreation ? 1 : 0)
  const [isLoading, setIsLoading] = useState(false)
  const { callServerFunction } = useServerFunction()

  const snbcRates = useMemo(
    () =>
      isEditMode
        ? getSNBCGeneralDisplayedReductionRates(trajectory)
        : calculateSNBCReductionRates(sectenData, studyYear),
    [isEditMode, trajectory, sectenData, studyYear],
  )

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
        referenceYear: trajectory.referenceYear?.toString(),
        objectives: trajectory.objectives.map((obj) => ({
          targetYear: obj.targetYear.toString(),
          reductionRate: Number((obj.reductionRate * 100).toFixed(2)),
        })),
      })
    }
  }, [trajectory, reset])

  const trajectoryType = watch('trajectoryType')

  const isSBTI = trajectoryType === TrajectoryType.SBTI_15 || trajectoryType === TrajectoryType.SBTI_WB2C
  const isSNBC = trajectoryType === TrajectoryType.SNBC_GENERAL || trajectoryType === TrajectoryType.SNBC_SECTORAL
  const isCustom = trajectoryType === TrajectoryType.CUSTOM

  const referenceYearStr = watch('referenceYear')
  const referenceYear = referenceYearStr ? getYearFromDateStr(referenceYearStr) : null
  // Use useWatch with control to properly track nested field changes
  const objectives = useWatch({ control, name: 'objectives' })

  const correctedObjectives = useMemo(() => {
    // For SBTI and SNBC, build objectives from rates since form objectives are empty
    let objectivesToUse = objectives
    if (isSBTI || isSNBC) {
      const rateTo2030 = isSNBC ? snbcRates?.rateTo2030 : isSBTI ? getReductionRatePerType(trajectoryType) : undefined
      const rateTo2050 = isSNBC ? snbcRates?.rateTo2050 : isSBTI ? getReductionRatePerType(trajectoryType) : undefined

      if (rateTo2030 !== undefined && rateTo2050 !== undefined) {
        objectivesToUse = [
          { targetYear: '2030', reductionRate: rateTo2030 * 100 },
          { targetYear: '2050', reductionRate: rateTo2050 * 100 },
        ]
      } else {
        return null
      }
    }

    const corrected = getCorrectedObjectives(
      studyYear,
      studyEmissions,
      objectivesToUse,
      trajectoryType,
      pastStudies,
      referenceYear,
      isSBTI,
      isSNBC,
      isCustom,
      sectenData,
    )

    if (!corrected) {
      return null
    }

    // For SBTI/SNBC, return corrected directly (they only have 2 objectives and don't need to be mapped back)
    if (isSBTI || isSNBC) {
      return corrected
    }

    // For custom trajectories, map corrected objectives back to their original positions
    // This ensures empty objectives get null, maintaining correct indexing
    const result: (BaseObjective | null)[] = []
    let correctedIndex = 0

    objectives.forEach((obj) => {
      if (obj.targetYear && obj.reductionRate !== null && obj.reductionRate !== undefined) {
        result.push(corrected[correctedIndex] || null)
        correctedIndex++
      } else {
        result.push(null)
      }
    })

    return result
  }, [
    studyYear,
    studyEmissions,
    objectives,
    trajectoryType,
    pastStudies,
    referenceYear,
    isSBTI,
    isSNBC,
    isCustom,
    sectenData,
    snbcRates?.rateTo2030,
    snbcRates?.rateTo2050,
  ])

  const steps = [t('steps.chooseTrajectory'), t('steps.defineObjectives')]

  const handleNext = () => {
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    reset({ ...defaultValues, trajectoryType })
    setActiveStep((prev) => prev - 1)
  }

  const handleModeSelect = (type: TrajectoryType) => {
    setValue('trajectoryType', type, { shouldValidate: true })

    const defaultReferenceYear = getDisplayedReferenceYearForTrajectoryType(type, studyYear)
    setValue('referenceYear', defaultReferenceYear.toString(), { shouldValidate: true })
  }

  const onSubmit = async (data: TrajectoryFormData) => {
    setIsLoading(true)
    if (!data.trajectoryType) {
      setIsLoading(false)
      return
    }

    const referenceYear = data.referenceYear ? getYearFromDateStr(data.referenceYear) : null

    if (isEditMode && trajectory) {
      const objectives = data.objectives
        .filter((obj) => obj.targetYear && obj.reductionRate !== null && obj.reductionRate !== undefined)
        .map((obj) => ({
          id: obj.id,
          targetYear: getYearFromDateStr(obj.targetYear!),
          reductionRate: Number((obj.reductionRate! / 100).toFixed(4)), // Keep precision of 2 digits percentage so 0.01% = 0.0001 => 4 digits
        }))

      await callServerFunction(
        () =>
          updateTrajectory(trajectory.id, {
            name: data.name,
            description: data.description,
            type: data.trajectoryType,
            referenceYear,
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
      referenceYear,
    }

    if (data.trajectoryType === TrajectoryType.CUSTOM) {
      input.objectives = data.objectives.map((obj) => ({
        targetYear: getYearFromDateStr(obj.targetYear!),
        reductionRate: Number((obj.reductionRate! / 100).toFixed(4)), // Keep precision of 2 digits percentage so 0.01% = 0.0001 => 4 digits
      }))
    } else if (data.trajectoryType === TrajectoryType.SBTI_15) {
      input.objectives = getDefaultObjectivesForTrajectoryType(TrajectoryType.SBTI_15)
    } else if (data.trajectoryType === TrajectoryType.SBTI_WB2C) {
      input.objectives = getDefaultObjectivesForTrajectoryType(TrajectoryType.SBTI_WB2C)
    } else if (data.trajectoryType === TrajectoryType.SNBC_GENERAL) {
      if (!snbcRates) {
        setIsLoading(false)
        throw new Error('Unable to calculate SNBC reduction rates. Secten data may be insufficient.')
      }
      input.objectives = [
        { targetYear: 2030, reductionRate: snbcRates.rateTo2030 },
        { targetYear: 2050, reductionRate: snbcRates.rateTo2050 },
      ]
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

  const isStep1Valid = trajectoryType !== null

  if (isEditMode || !isFirstCreation) {
    return (
      <Modal
        label={isEditMode ? 'trajectory-edit' : 'trajectory-creation'}
        open={open}
        onClose={() => {
          onClose()
        }}
        title={isEditMode ? t('editTitle') : t('addTitle')}
        actions={[
          {
            children: t('cancel'),
            onClick: onClose,
            variant: 'outlined',
          },
          {
            actionType: 'loadingButton',
            children: isEditMode ? t('save') : t('submit'),
            loading: isLoading,
            onClick: handleSubmit(onSubmit),
            disabled: !isValid,
          },
        ]}
      >
        {trajectoryType && (
          <TrajectoryCreationStep2
            isSBTI={isSBTI}
            isSNBC={isSNBC}
            trajectoryType={trajectoryType}
            control={control}
            showTrajectoryTypeSelector={!isEditMode}
            handleModeSelect={handleModeSelect}
            studyYear={studyYear}
            snbcRates={snbcRates}
            correctedObjectives={correctedObjectives}
          />
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
        <TrajectoryCreationStep2
          isSBTI={isSBTI}
          isSNBC={isSNBC}
          trajectoryType={trajectoryType}
          control={control}
          showTrajectoryTypeSelector={false}
          handleModeSelect={handleModeSelect}
          studyYear={studyYear}
          snbcRates={snbcRates}
          correctedObjectives={correctedObjectives}
        />
      )}
    </ModalStepper>
  )
}

export default TrajectoryCreationModal
