'use client'

import Button from '@/components/base/Button'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectivesAndScope } from '@/db/transitionPlan'
import { useTransitionPlanFilters } from '@/hooks/useTransitionPlanFilters'
import { getFilteredStudyEmissions, getStudyTotalCo2Emissions } from '@/services/study'
import { matchesScopeFilter } from '@/utils/scopeFilter'
import {
  convertToPastStudies,
  getDefaultSnbcSectoralPercentages,
  getDefaultSnbcSectoralTrajectory,
} from '@/utils/trajectory'
import AddIcon from '@mui/icons-material/Add'
import { Tooltip, Typography } from '@mui/material'
import type { Action, ExternalStudy, SectenInfo, TransitionPlan } from '@prisma/client'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Block from '../base/Block'
import ObjectiveFilters from '../study/trajectory/ObjectiveFilters'
import ObjectivesTable from '../study/trajectory/ObjectivesTable'
import TrajectoryGraph from '../study/transitionPlan/TrajectoryGraph'
import TransitionPlanFilters from '../study/transitionPlan/TransitionPlanFilters'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'

const TrajectoryCreationModal = dynamic(() => import('@/components/study/trajectory/TrajectoryCreationModal'))

interface Props {
  study: FullStudy
  canEdit: boolean
  transitionPlan: TransitionPlan
  trajectories?: TrajectoryWithObjectivesAndScope[]
  linkedStudies?: FullStudy[]
  linkedExternalStudies?: ExternalStudy[]
  actions?: Action[]
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
  const tNav = useTranslations('nav')
  const router = useRouter()
  const searchParams = useSearchParams()
  const tStudyNav = useTranslations('study.navigation')
  const [showTrajectoryModal, setShowTrajectoryModal] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const {
    selectedSiteIds,
    selectedPostIds,
    selectedTagIds,
    filtersMounted,
    setSelectedSiteIds,
    setSelectedPostIds,
    setSelectedTagIds,
  } = useTransitionPlanFilters(study.id)

  useEffect(() => {
    if (searchParams.get('openModal') === 'true') {
      setShowTrajectoryModal(true)
    }
  }, [searchParams])

  const pastStudies = useMemo(
    () => convertToPastStudies(linkedStudies, linkedExternalStudies, validatedOnly, study.resultsUnit),
    [linkedStudies, linkedExternalStudies, validatedOnly, study.resultsUnit],
  )

  const studyTotalEmissions = useMemo(
    () => getStudyTotalCo2Emissions(study, true, validatedOnly),
    [study, validatedOnly],
  )

  const filteredStudyEmissions = useMemo(() => {
    const subPosts = selectedPostIds.filter((id): id is SubPost => Object.values(SubPost).includes(id as SubPost))
    return getFilteredStudyEmissions(study, validatedOnly, selectedSiteIds, subPosts, selectedTagIds)
  }, [study, validatedOnly, selectedSiteIds, selectedPostIds, selectedTagIds])

  const filterRatio = studyTotalEmissions > 0 ? Math.min(1, filteredStudyEmissions / studyTotalEmissions) : 1

  const filteredPastStudies = useMemo(
    () => pastStudies.map((ps) => ({ ...ps, totalCo2: ps.totalCo2 * filterRatio })),
    [pastStudies, filterRatio],
  )

  const filteredActions = actions

  const filteredTrajectories = useMemo(
    () =>
      trajectories.filter((traj) => {
        if (traj.objectives.length === 0) {
          return true
        }
        return traj.objectives.some((obj) =>
          matchesScopeFilter(
            obj.sites?.map((s) => s.studySite.siteId) ?? [],
            obj.subPosts?.map((sp) => sp.subPost) ?? [],
            obj.tags?.map((tag) => tag.studyTag.id) ?? [],
            selectedSiteIds,
            selectedPostIds,
            selectedTagIds,
          ),
        )
      }),
    [trajectories, selectedSiteIds, selectedPostIds, selectedTagIds],
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
    <>
      <Breadcrumbs
        current={tStudyNav('trajectories')}
        links={[
          { label: tNav('home'), link: '/' },
          study.organizationVersion.isCR
            ? {
                label: study.organizationVersion.organization.name,
                link: `/organisations/${study.organizationVersion.id}`,
              }
            : undefined,
          { label: study.name, link: `/etudes/${study.id}` },
        ].filter((link) => link !== undefined)}
      />
      <Block
        title={t('trajectories.title')}
        as="h2"
        rightComponent={
          <TransitionPlanFilters
            study={study}
            selectedSiteIds={selectedSiteIds}
            selectedPostIds={selectedPostIds}
            selectedTagIds={selectedTagIds}
            onSiteFilterChange={setSelectedSiteIds}
            onPostFilterChange={setSelectedPostIds}
            onTagFilterChange={setSelectedTagIds}
            filtersMounted={filtersMounted}
          />
        }
      >
        <div className="flex-col gapped2">
          <TransitionPlanOnboarding
            title={t('trajectories.onboarding.title')}
            description={t('trajectories.onboarding.description')}
            storageKey="trajectory-reduction"
            detailedContent={null}
          />

          <TrajectoryGraph
            study={study}
            trajectories={filteredTrajectories}
            actions={filteredActions}
            linkedStudies={linkedStudies}
            sectenData={sectenData}
            selectedSnbcTrajectories={[]}
            selectedSbtiTrajectories={[]}
            selectedCustomTrajectories={filteredTrajectories.map((t) => t.id)}
            pastStudies={filteredPastStudies}
            validatedOnly={validatedOnly}
            studyEmissions={filteredStudyEmissions}
            titleAction={addButton}
            storageKey={`trajectory-page-${transitionPlan.id}`}
            isTrajectoryPage
          />

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
            />
          )}
        </div>
      </Block>
    </>
  )
}

export default TrajectoryPage
