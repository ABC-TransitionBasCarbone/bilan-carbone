'use client'

import Block from '@/components/base/Block'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import type { FullStudy } from '@/db/study'
import { useTransitionPlan } from '@/hooks/useTransitionPlan'
import { useTransitionPlanFilters } from '@/hooks/useTransitionPlanFilters'
import type {
  ActionWithRelations,
  ObjectiveGroup,
  PastStudy,
  TrajectoryWithObjectivesAndScope,
} from '@/types/trajectory.types'
import { buildObjectiveGroups } from '@/utils/scope.utils'
import { scopeMatchesUIFilters } from '@/utils/scopeFilter'
import { getActionReductionRatio } from '@/utils/study'
import type { ExternalStudy, SectenInfo, SubPost } from '@repo/db-common'
import { useTranslations } from 'next-intl'
import { ReactNode, useMemo } from 'react'
import TrajectoryGraph from './TrajectoryGraph'
import TransitionPlanFilters from './TransitionPlanFilters'
import TransitionPlanOnboarding from './TransitionPlanOnboarding'

export interface TransitionPlanBaseChildProps {
  filteredStudyEmissions: number
  filteredPastStudies: PastStudy[]
  filteredTrajectories: TrajectoryWithObjectivesAndScope[]
  filteredActions: ActionWithRelations[]
  selectedSiteIds: string[]
  selectedSubPosts: SubPost[]
  selectedTagIds: string[]
  objectiveGroupsByTrajectoryId: Map<string, ObjectiveGroup[]> | undefined
}

interface Props {
  study: FullStudy
  canEdit: boolean
  transitionPlanId: string
  trajectories: TrajectoryWithObjectivesAndScope[]
  actions: ActionWithRelations[]
  linkedStudies: FullStudy[]
  linkedExternalStudies: ExternalStudy[]
  validatedOnly: boolean
  sectenData: SectenInfo[]
  breadcrumbCurrent: string
  blockTitle: string
  onboardingTitle: string
  onboardingDescription: string | ReactNode | null
  onboardingStorageKey: string
  onboardingDetailedContent: string | ReactNode | null
  graphTitleAction?: ReactNode
  children: (props: TransitionPlanBaseChildProps) => ReactNode
}

const TransitionPlanBase = ({
  study,
  transitionPlanId,
  trajectories,
  actions,
  linkedStudies,
  linkedExternalStudies,
  validatedOnly,
  sectenData,
  breadcrumbCurrent,
  blockTitle,
  onboardingTitle,
  onboardingDescription,
  onboardingStorageKey,
  onboardingDetailedContent,
  graphTitleAction,
  children,
}: Props) => {
  const tNav = useTranslations('nav')
  const {
    selectedSiteIds,
    selectedSubPosts,
    selectedTagIds,
    filtersMounted,
    setSelectedSiteIds,
    setSelectedSubPosts,
    setSelectedTagIds,
  } = useTransitionPlanFilters(study.id)

  const allTagIds = useMemo(() => study.tagFamilies.flatMap((f) => f.tags.map((tag) => tag.id)), [study.tagFamilies])

  const { filteredStudyEmissions, filteredPastStudies } = useTransitionPlan({
    study,
    linkedStudies,
    linkedExternalStudies,
    validatedOnly,
    selectedSiteIds,
    selectedSubPosts,
    selectedTagIds,
  })

  const filteredTrajectories = useMemo(
    () =>
      trajectories.map((traj) => ({
        ...traj,
        objectives: traj.objectives.filter((obj) => {
          const hasScope = obj.sites.length > 0 || obj.subPosts.length > 0 || obj.tags.length > 0
          if (!hasScope) {
            return true
          }
          return scopeMatchesUIFilters(
            obj.sites.map((s) => s.studySite.siteId),
            obj.subPosts.map((sp) => sp.subPost),
            obj.tags.map((tag) => tag.studyTag.id),
            selectedSiteIds,
            selectedSubPosts,
            selectedTagIds,
            allTagIds,
          )
        }),
      })),
    [trajectories, selectedSiteIds, selectedSubPosts, selectedTagIds, allTagIds],
  )

  const objectiveGroupsByTrajectoryId = useMemo(() => {
    const result = new Map<string, ObjectiveGroup[]>()
    for (const traj of trajectories) {
      const groups = buildObjectiveGroups({
        study,
        validatedOnly,
        objectives: traj.objectives,
        filterSiteIds: selectedSiteIds,
        filterSubPosts: selectedSubPosts,
        filterTagIds: selectedTagIds,
      })
      if (groups) {
        result.set(traj.id, groups)
      }
    }
    return result.size > 0 ? result : undefined
  }, [trajectories, study, validatedOnly, selectedSiteIds, selectedSubPosts, selectedTagIds])

  const filteredActions = useMemo(() => {
    const studyHasTags = allTagIds.length > 0
    if (
      selectedSiteIds.length === 0 ||
      selectedSubPosts.length === 0 ||
      (studyHasTags && selectedTagIds.length === 0)
    ) {
      return []
    }

    return actions
      .filter((action) =>
        scopeMatchesUIFilters(
          action.sites?.map((s) => s.studySite.siteId) ?? [],
          action.subPosts?.map((sp) => sp.subPost) ?? [],
          action.tags?.map((tag) => tag.studyTag.id) ?? [],
          selectedSiteIds,
          selectedSubPosts,
          selectedTagIds,
        ),
      )
      .map((action) => {
        if (action.reductionValueKg === null) {
          return action
        }
        const ratio = getActionReductionRatio(
          study,
          validatedOnly,
          action.sites.map((s) => s.studySite.siteId),
          action.subPosts.map((sp) => sp.subPost),
          action.tags.map((tag) => tag.studyTag.id),
          selectedSiteIds,
          selectedSubPosts,
          selectedTagIds,
        )
        return { ...action, reductionValueKg: action.reductionValueKg * ratio }
      })
  }, [allTagIds.length, selectedSiteIds, selectedSubPosts, selectedTagIds, actions, study, validatedOnly])

  return (
    <>
      <Breadcrumbs
        current={breadcrumbCurrent}
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
        title={blockTitle}
        as="h2"
        rightComponent={
          <TransitionPlanFilters
            study={study}
            selectedSiteIds={selectedSiteIds}
            selectedSubPosts={selectedSubPosts}
            selectedTagIds={selectedTagIds}
            onSiteFilterChange={setSelectedSiteIds}
            onSubPostFilterChange={setSelectedSubPosts}
            onTagFilterChange={setSelectedTagIds}
            filtersMounted={filtersMounted}
          />
        }
      >
        <div className="flex-col gapped2">
          <TransitionPlanOnboarding
            title={onboardingTitle}
            description={onboardingDescription}
            storageKey={onboardingStorageKey}
            detailedContent={onboardingDetailedContent}
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
            titleAction={graphTitleAction}
            storageKey={`trajectory-page-${transitionPlanId}`}
            objectiveGroupsByTrajectoryId={objectiveGroupsByTrajectoryId}
          />
          {children({
            filteredStudyEmissions,
            filteredPastStudies,
            filteredTrajectories,
            filteredActions,
            selectedSiteIds,
            selectedSubPosts,
            selectedTagIds,
            objectiveGroupsByTrajectoryId,
          })}
        </div>
      </Block>
    </>
  )
}

export default TransitionPlanBase
