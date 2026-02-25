'use client'

import SectorPercentageInputs from '@/components/study/trajectory/SectorPercentageInputs'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectivesAndScope } from '@/db/transitionPlan'
import { SectorPercentages, sectorPercentagesSchema } from '@/services/serverFunctions/trajectory.command'
import { getStudyTotalCo2Emissions } from '@/services/study'
import { calculateSectoralSNBCReductionRates } from '@/utils/snbc'
import { PastStudy } from '@/utils/trajectory'
import { zodResolver } from '@hookform/resolvers/zod'
import { Typography } from '@mui/material'
import type { SectenInfo } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import OnboardingSectionStep from './OnboardingSectionStep'

const sectorFormSchema = z.object({
  sectorPercentages: sectorPercentagesSchema,
})

export type SectorFormData = z.infer<typeof sectorFormSchema>

interface Props {
  canEdit: boolean
  defaultSnbcSectoralTrajectory: TrajectoryWithObjectivesAndScope | null
  study: FullStudy
  pastStudies: PastStudy[]
  sectenData: SectenInfo[]
  validatedOnly: boolean
  isVisible: boolean
  isActive: boolean
  onClickNext: () => void
  onSaveTrajectory: (sectorPercentages: SectorPercentages) => Promise<void>
}

const SectorAllocationBlock = ({
  canEdit,
  defaultSnbcSectoralTrajectory,
  study,
  pastStudies,
  sectenData,
  validatedOnly,
  isVisible,
  isActive,
  onClickNext,
  onSaveTrajectory: onSaveSnbcTrajectory,
}: Props) => {
  const t = useTranslations('study.transitionPlan.initialization.stepSectorAllocation')
  const tBlock = useTranslations('study.transitionPlan.initialization.sectorBlock')
  const tCommon = useTranslations('common')
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

  const onSubmit = async (data: SectorFormData) => {
    if (!snbcRates) {
      return
    }
    setLoading(true)
    await onSaveSnbcTrajectory(data.sectorPercentages)
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
