'use client'

import TransitionPlanBase from '@/components/study/transitionPlan/TransitionPlanBase'
import { FullStudy } from '@/db/study'
import { customRich } from '@/i18n/customRich'
import { getStudyTotalCo2Emissions } from '@/services/study'
import type { ActionWithRelations, TrajectoryWithObjectivesAndScope } from '@/types/trajectory.types'
import { getDefaultSnbcSectoralPercentages, getDefaultSnbcSectoralTrajectory } from '@/utils/trajectory'
import AddIcon from '@mui/icons-material/Add'
import { Tooltip, Typography } from '@mui/material'
import type { ExternalStudy, SectenInfo, TransitionPlan } from '@prisma/client'
import { Button } from '@repo/ui'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import ObjectiveFilters from '../study/trajectory/ObjectiveFilters'
import ObjectivesTable from '../study/trajectory/ObjectivesTable'

const TrajectoryCreationModal = dynamic(() => import('@/components/study/trajectory/TrajectoryCreationModal'))

interface Props {
  study: FullStudy
  canEdit: boolean
  transitionPlan: TransitionPlan
  trajectories?: TrajectoryWithObjectivesAndScope[]
  linkedStudies?: FullStudy[]
  linkedExternalStudies?: ExternalStudy[]
  actions?: ActionWithRelations[]
  validatedOnly: boolean
  sectenData?: SectenInfo[]
}

const TrajectoryPage = ({
  study,
  canEdit,
  transitionPlan,
  trajectories = [],
  linkedStudies = [],
  linkedExternalStudies = [],
  actions = [],
  validatedOnly,
  sectenData = [],
}: Props) => {
  const t = useTranslations('study.transitionPlan')
  const tStudyNav = useTranslations('study.navigation')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showTrajectoryModal, setShowTrajectoryModal] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')

  useEffect(() => {
    if (searchParams.get('openModal') === 'true') {
      setShowTrajectoryModal(true)
    }
  }, [searchParams])

  const studyTotalEmissions = useMemo(
    () => getStudyTotalCo2Emissions(study, true, validatedOnly),
    [study, validatedOnly],
  )

  const defaultSnbcSectoralPercentages = useMemo(() => getDefaultSnbcSectoralPercentages(trajectories), [trajectories])

  const defaultSnbcSectoralTrajectoryId = useMemo(
    () => getDefaultSnbcSectoralTrajectory(trajectories)?.id ?? null,
    [trajectories],
  )

  const sites = useMemo(() => study.sites.map((s) => ({ id: s.id, name: s.site.name })), [study.sites])

  const canCreateTrajectory = canEdit && studyTotalEmissions > 0

  const addButton = canEdit && (
    <Tooltip title={studyTotalEmissions === 0 ? t('trajectories.graph.noEmissionSourcesDisabledButton') : ''}>
      <span>
        <Button startIcon={<AddIcon />} onClick={() => setShowTrajectoryModal(true)} disabled={!canCreateTrajectory}>
          {t('trajectories.addTrajectory')}
        </Button>
      </span>
    </Tooltip>
  )

  return (
    <TransitionPlanBase
      study={study}
      canEdit={canEdit}
      transitionPlanId={transitionPlan.id}
      trajectories={trajectories}
      actions={actions}
      linkedStudies={linkedStudies}
      linkedExternalStudies={linkedExternalStudies}
      validatedOnly={validatedOnly}
      sectenData={sectenData}
      breadcrumbCurrent={tStudyNav('trajectories')}
      blockTitle={t('trajectories.title')}
      onboardingTitle={t('trajectories.onboarding.title')}
      onboardingDescription={customRich(t, 'trajectories.onboarding.description')}
      onboardingStorageKey="trajectory-reduction"
      onboardingDetailedContent={customRich(t, 'trajectories.onboarding.detailedInfo')}
      graphTitleAction={addButton}
    >
      {({ filteredStudyEmissions, filteredPastStudies, filteredTrajectories, selectedSiteIds }) => (
        <>
          <div className="flex-col gapped1">
            <Typography variant="h5" component="h2" fontWeight={600}>
              {t('trajectories.tableTitle')}
            </Typography>
            <ObjectiveFilters search={searchFilter} setSearch={setSearchFilter} />

            <ObjectivesTable
              trajectories={filteredTrajectories}
              canEdit={canEdit}
              transitionPlanId={transitionPlan.id}
              studyId={study.id}
              studyYear={study.startDate.getFullYear()}
              searchFilter={searchFilter}
              sectenData={sectenData}
              studyEmissions={filteredStudyEmissions}
              pastStudies={filteredPastStudies}
              sites={sites}
              tagFamilies={study.tagFamilies}
              defaultSnbcSectoralTrajectoryId={defaultSnbcSectoralTrajectoryId}
            />
          </div>

          {showTrajectoryModal && (
            <TrajectoryCreationModal
              open={showTrajectoryModal}
              onClose={() => setShowTrajectoryModal(false)}
              transitionPlanId={transitionPlan.id}
              onSuccess={() => router.refresh()}
              trajectory={null}
              isFirstCreation={trajectories.length <= 1} // There is one default SNBC trajectory created when saving sector percentages
              studyYear={study.startDate.getFullYear()}
              sectenData={sectenData}
              studyEmissions={filteredStudyEmissions}
              pastStudies={filteredPastStudies}
              defaultSnbcSectoralPercentages={defaultSnbcSectoralPercentages}
              selectedSiteIds={selectedSiteIds}
              siteOptions={study.sites.map((s) => ({ id: s.site.id, name: s.site.name }))}
            />
          )}
        </>
      )}
    </TransitionPlanBase>
  )
}

export default TrajectoryPage
