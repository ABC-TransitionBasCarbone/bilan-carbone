'use client'

import LoadingButton from '@/components/base/LoadingButton'
import Modal from '@/components/modals/Modal'
import { useServerFunction } from '@/hooks/useServerFunction'
import {
  createTrajectorySchema,
  SectorPercentages,
  TrajectoryFormData,
} from '@/services/serverFunctions/trajectory.command'
import {
  CreateTrajectoryInput,
  createTrajectoryWithObjectives,
  updateTrajectory,
} from '@/services/serverFunctions/trajectory.serverFunction'
import type { BaseObjective, PastStudy } from '@/types/trajectory.types'
import { TrajectoryWithObjectivesAndScope } from '@/types/trajectory.types'
import {
  calculateBaseSNBCReductionRates,
  calculateSectoralSNBCReductionRates,
  extractSNBCReductionRatesFromObjectives,
  SNBC_FINAL_TARGET_YEAR,
} from '@/utils/snbc'
import { getYearFromDateStr } from '@/utils/time'
import {
  getCorrectedObjectives,
  getDefaultObjectivesForTrajectoryType,
  getDefaultSBTIReductionRate,
  getDisplayedReferenceYearForTrajectoryType,
  SBTI_START_YEAR,
} from '@/utils/trajectory'
import { zodResolver } from '@hookform/resolvers/zod'
import type { SectenInfo } from '@repo/db-common'
import { TrajectoryType } from '@repo/db-common/enums'
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
  trajectory: TrajectoryWithObjectivesAndScope | null
  isFirstCreation?: boolean
  studyYear: number
  sectenData: SectenInfo[]
  studyEmissions?: number
  pastStudies?: PastStudy[]
  defaultSnbcSectoralPercentages?: SectorPercentages | null
}

const getDefaultValues = (defaultSnbcSectoralPercentages?: SectorPercentages | null): TrajectoryFormData => ({
  trajectoryType: TrajectoryType.SBTI_15,
  name: '',
  description: '',
  referenceYear: SBTI_START_YEAR.toString(),
  objectives: Array.from({ length: 2 }).map(() => ({
    targetYear: null,
    reductionRate: null,
  })),
  sectorPercentages: defaultSnbcSectoralPercentages ?? {
    energy: 0,
    industry: 0,
    waste: 0,
    buildings: 0,
    agriculture: 0,
    transportation: 0,
  },
})

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
  defaultSnbcSectoralPercentages,
}: Props) => {
  const t = useTranslations('study.transitionPlan.trajectoryModal')
  const isEditMode = !!trajectory
  const [activeStep, setActiveStep] = useState(isEditMode || !isFirstCreation ? 1 : 0)
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
    defaultValues: getDefaultValues(defaultSnbcSectoralPercentages),
    resolver: zodResolver(trajectorySchema),
    mode: 'onChange',
  })

  const trajectoryType = watch('trajectoryType')
  const sectorPercentages = useWatch({ control, name: 'sectorPercentages' })

  const snbcRates = useMemo(() => {
    // For SNBC_SECTORAL (both create and edit), calculate based on sector percentages
    if (trajectoryType === TrajectoryType.SNBC_SECTORAL && sectorPercentages) {
      const rates = calculateSectoralSNBCReductionRates(
        {
          studyEmissions,
          studyStartYear: studyYear,
          sectenData,
          pastStudies,
          displayCurrentStudyValueOnTrajectory: true,
          maxYear: SNBC_FINAL_TARGET_YEAR,
        },
        sectorPercentages,
      )
      return rates
    } else if (trajectoryType === TrajectoryType.SNBC_GENERAL) {
      if (isEditMode) {
        return extractSNBCReductionRatesFromObjectives(trajectory.objectives)
      }
      return calculateBaseSNBCReductionRates(sectenData, studyYear)
    }
    return null
  }, [trajectoryType, sectorPercentages, studyEmissions, studyYear, sectenData, pastStudies, isEditMode, trajectory])

  useEffect(() => {
    if (trajectory) {
      const defaultObjectives = trajectory.objectives.filter((obj) => obj.isDefault)
      reset({
        trajectoryType: trajectory.type,
        name: trajectory.name,
        description: trajectory.description || '',
        referenceYear: trajectory.referenceYear?.toString(),
        objectives: defaultObjectives.map((obj) => ({
          targetYear: obj.targetYear.toString(),
          reductionRate: Number((obj.reductionRate * 100).toFixed(2)),
        })),
        sectorPercentages: trajectory.sectorPercentages
          ? (trajectory.sectorPercentages as SectorPercentages)
          : {
              energy: 0,
              industry: 0,
              waste: 0,
              buildings: 0,
              agriculture: 0,
              transportation: 0,
            },
      })
    }
  }, [trajectory, reset])

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
    let rateTo2015 = null
    let rateTo2030 = null
    let rateTo2050 = null

    if (isSBTI) {
      const singleRate = getDefaultSBTIReductionRate(trajectoryType)
      rateTo2030 = singleRate
      rateTo2050 = singleRate
    } else if (isSNBC) {
      rateTo2015 = snbcRates?.rateTo2015
      rateTo2030 = snbcRates?.rateTo2030
      rateTo2050 = snbcRates?.rateTo2050
    }

    if (rateTo2030 !== null && rateTo2030 !== undefined && rateTo2050 !== null && rateTo2050 !== undefined) {
      objectivesToUse = []

      if (rateTo2015 !== null && rateTo2015 !== undefined) {
        objectivesToUse.push({ targetYear: '2015', reductionRate: rateTo2015 * 100 })
      }

      objectivesToUse.push(
        { targetYear: '2030', reductionRate: rateTo2030 * 100 },
        { targetYear: '2050', reductionRate: rateTo2050 * 100 },
      )
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
      trajectoryType === TrajectoryType.SNBC_SECTORAL ? sectorPercentages : undefined,
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
    snbcRates?.rateTo2015,
    snbcRates?.rateTo2030,
    snbcRates?.rateTo2050,
    sectorPercentages,
  ])

  const steps = [t('steps.chooseTrajectory'), t('steps.defineObjectives')]

  const handleNext = () => {
    setActiveStep((prev) => prev + 1)
  }

  const handleBack = () => {
    reset({ ...getDefaultValues(defaultSnbcSectoralPercentages), trajectoryType })
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
      let objectives

      const defaultObjectives = trajectory.objectives.filter((obj) => obj.isDefault)

      if (data.trajectoryType === TrajectoryType.SNBC_SECTORAL || data.trajectoryType === TrajectoryType.SNBC_GENERAL) {
        if (!snbcRates) {
          setIsLoading(false)
          throw new Error('Unable to calculate SNBC reduction rates')
        }

        const objectivesArray: { targetYear: number; reductionRate: number }[] = []

        if (snbcRates.rateTo2015 !== undefined) {
          objectivesArray.push({ targetYear: 2015, reductionRate: snbcRates.rateTo2015 })
        }

        objectivesArray.push({ targetYear: 2030, reductionRate: snbcRates.rateTo2030 })
        objectivesArray.push({ targetYear: 2050, reductionRate: snbcRates.rateTo2050 })

        objectives = objectivesArray.map((obj, index) => ({
          id: defaultObjectives[index]?.id,
          targetYear: obj.targetYear,
          reductionRate: Number(obj.reductionRate.toFixed(4)),
        }))
      } else if (data.trajectoryType === TrajectoryType.SBTI_15 || data.trajectoryType === TrajectoryType.SBTI_WB2C) {
        const baseRate = getDefaultSBTIReductionRate(data.trajectoryType)
        if (!baseRate) {
          setIsLoading(false)
          throw new Error('Unable to get SBTI reduction rate')
        }

        objectives = [
          {
            id: defaultObjectives[0]?.id,
            targetYear: 2030,
            reductionRate: Number(baseRate.toFixed(4)),
          },
          {
            id: defaultObjectives[1]?.id,
            targetYear: 2050,
            reductionRate: Number(baseRate.toFixed(4)),
          },
        ]
      } else {
        objectives = data.objectives
          .filter((obj) => obj.targetYear && obj.reductionRate !== null && obj.reductionRate !== undefined)
          .map((obj, index) => ({
            id: defaultObjectives[index]?.id,
            targetYear: getYearFromDateStr(obj.targetYear!),
            reductionRate: Number((obj.reductionRate! / 100).toFixed(4)),
          }))
      }

      await callServerFunction(
        () =>
          updateTrajectory(trajectory.id, {
            name: data.name,
            description: data.description,
            type: data.trajectoryType,
            referenceYear,
            sectorPercentages: data.sectorPercentages,
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
    } else if (data.trajectoryType === TrajectoryType.SNBC_SECTORAL) {
      const sectorPercentages = data.sectorPercentages ?? defaultSnbcSectoralPercentages
      if (!sectorPercentages) {
        setIsLoading(false)
        throw new Error('Sector percentages are required')
      }

      if (!snbcRates) {
        setIsLoading(false)
        throw new Error('Unable to calculate SNBC reduction rates')
      }

      input.sectorPercentages = sectorPercentages

      const objectives: { targetYear: number; reductionRate: number }[] = []

      if (snbcRates.rateTo2015 !== undefined) {
        objectives.push({ targetYear: 2015, reductionRate: snbcRates.rateTo2015 })
      }

      objectives.push({ targetYear: 2030, reductionRate: snbcRates.rateTo2030 })
      objectives.push({ targetYear: 2050, reductionRate: snbcRates.rateTo2050 })

      input.objectives = objectives
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
