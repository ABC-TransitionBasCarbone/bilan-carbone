'use client'

import SectorPercentageInputs from '@/components/study/trajectory/SectorPercentageInputs'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectivesAndScope } from '@/db/transitionPlan'
import { useServerFunction } from '@/hooks/useServerFunction'
import { SectorPercentages, sectorPercentagesSchema } from '@/services/serverFunctions/trajectory.command'
import { createTrajectoryWithObjectives, updateTrajectory } from '@/services/serverFunctions/trajectory.serverFunction'
import { getStudyTotalCo2Emissions } from '@/services/study'
import { calculateSectoralSNBCReductionRates } from '@/utils/snbc'
import { PastStudy } from '@/utils/trajectory'
import { zodResolver } from '@hookform/resolvers/zod'
import { Typography } from '@mui/material'
import type { SectenInfo } from '@prisma/client'
import { TrajectoryType } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import OnboardingSectionStep from './OnboardingSectionStep'

const sectorFormSchema = z.object({
  sectorPercentages: sectorPercentagesSchema,
})

export type SectorFormData = z.infer<typeof sectorFormSchema>

interface Props {
  transitionPlanId: string
  canEdit: boolean
  defaultSnbcSectoralTrajectory: TrajectoryWithObjectivesAndScope | null
  study: FullStudy
  pastStudies: PastStudy[]
  sectenData: SectenInfo[]
  validatedOnly: boolean
  isVisible: boolean
  isActive: boolean
  onClickNext: () => void
}

const SectorAllocationBlock = ({
  transitionPlanId,
  canEdit,
  defaultSnbcSectoralTrajectory,
  study,
  pastStudies,
  sectenData,
  validatedOnly,
  isVisible,
  isActive,
  onClickNext,
}: Props) => {
  const t = useTranslations('study.transitionPlan.initialization.stepSectorAllocation')
  const tBlock = useTranslations('study.transitionPlan.initialization.sectorBlock')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const [loading, setLoading] = useState(false)

  const defaultPercentages = defaultSnbcSectoralTrajectory?.sectorPercentages as SectorPercentages | null | undefined

  const { control, handleSubmit } = useForm<SectorFormData>({
    resolver: zodResolver(sectorFormSchema),
    defaultValues: {
      sectorPercentages: {
        energy: defaultPercentages?.energy ?? 0,
        industry: defaultPercentages?.industry ?? 0,
        waste: defaultPercentages?.waste ?? 0,
        buildings: defaultPercentages?.buildings ?? 0,
        agriculture: defaultPercentages?.agriculture ?? 0,
        transportation: defaultPercentages?.transportation ?? 0,
      },
    },
  })

  const sectorPercentages = useWatch({ control, name: 'sectorPercentages' })

  const totalPercentage = useMemo(
    () => (sectorPercentages ? Object.values(sectorPercentages).reduce((sum, val) => sum + (val || 0), 0) : 0),
    [sectorPercentages],
  )

  const isOverLimit = totalPercentage > 100

  const studyEmissions = useMemo(() => getStudyTotalCo2Emissions(study, true, validatedOnly), [study, validatedOnly])

  const snbcRates = useMemo(() => {
    if (!sectorPercentages || isOverLimit) {
      return null
    }
    return calculateSectoralSNBCReductionRates(
      {
        studyEmissions,
        studyStartYear: study.startDate.getFullYear(),
        sectenData,
        pastStudies,
      },
      sectorPercentages,
    )
  }, [sectorPercentages, isOverLimit, studyEmissions, study.startDate, sectenData, pastStudies])

  const buildObjectives = () => {
    if (!snbcRates) {
      return []
    }
    const objectives: { targetYear: number; reductionRate: number }[] = []
    if (snbcRates.rateTo2015 !== undefined) {
      objectives.push({ targetYear: 2015, reductionRate: snbcRates.rateTo2015 })
    }
    objectives.push({ targetYear: 2030, reductionRate: snbcRates.rateTo2030 })
    objectives.push({ targetYear: 2050, reductionRate: snbcRates.rateTo2050 })
    return objectives
  }

  const onSubmit = async (data: SectorFormData) => {
    if (!snbcRates) {
      return
    }

    setLoading(true)

    if (defaultSnbcSectoralTrajectory) {
      const defaultObjectives = defaultSnbcSectoralTrajectory.objectives.filter((obj) => obj.isDefault)
      const objectives = buildObjectives().map((obj, index) => ({
        id: defaultObjectives[index]?.id,
        targetYear: obj.targetYear,
        reductionRate: Number(obj.reductionRate.toFixed(4)),
      }))
      await callServerFunction(
        () =>
          updateTrajectory(defaultSnbcSectoralTrajectory.id, {
            sectorPercentages: data.sectorPercentages,
            objectives,
          }),
        { onSuccess: () => router.refresh() },
      )
    } else {
      await callServerFunction(
        () =>
          createTrajectoryWithObjectives({
            transitionPlanId,
            name: tBlock('snbcSectorialName'),
            type: TrajectoryType.SNBC_SECTORAL,
            sectorPercentages: data.sectorPercentages,
            objectives: buildObjectives(),
          }),
        { onSuccess: () => router.refresh() },
      )
    }

    setLoading(false)
  }

  const handleNext = async () => {
    if (canEdit) {
      await handleSubmit(onSubmit)()
    }
    onClickNext()
  }

  return (
    <OnboardingSectionStep
      title={t('title')}
      description={t('description')}
      glossaryLabel="init-step-sector-allocation"
      glossaryTitleKey="glossaryTitle"
      tModal="study.transitionPlan.initialization.stepSectorAllocation"
      isVisible={isVisible}
      isActive={isActive}
      onClickNext={handleNext}
      nextButtonLabel={isActive ? tCommon('action.confirm') : tBlock('update')}
      nextButtonLoading={loading}
      nextButtonDisabled={isOverLimit}
    >
      <div className="flex-col gapped1">
        <Typography variant="body1">{tBlock('description')}</Typography>
        <SectorPercentageInputs canEdit={canEdit} control={control} />
      </div>
    </OnboardingSectionStep>
  )
}

export default SectorAllocationBlock
