'use client'

import Block from '@/components/base/Block'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { FullStudy } from '@/db/study'
import type { ActionWithRelations, TrajectoryWithObjectivesAndScope } from '@/db/transitionPlan'
import { useTransitionPlanFilters } from '@/hooks/useTransitionPlanFilters'
import { getStudyTotalCo2Emissions } from '@/services/study'
import { matchesScopeFilter } from '@/utils/scopeFilter'
import { getActionReductionRatio, getUIFilteredEmissions } from '@/utils/study'
import { convertToPastStudies, PastStudy } from '@/utils/trajectory'
import type { ExternalStudy, SectenInfo } from '@prisma/client'
import { SubPost } from '@prisma/client'
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
  selectedPostIds: string[]
  selectedTagIds: string[]
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
  onboardingDescription: string
  onboardingStorageKey: string
  onboardingDetailedContent: ReactNode
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
    selectedPostIds,
    selectedTagIds,
    filtersMounted,
    setSelectedSiteIds,
    setSelectedPostIds,
    setSelectedTagIds,
  } = useTransitionPlanFilters(study.id)

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
    return getUIFilteredEmissions(study, validatedOnly, selectedSiteIds, subPosts, selectedTagIds)
  }, [study, validatedOnly, selectedSiteIds, selectedPostIds, selectedTagIds])

  const filterRatio = studyTotalEmissions > 0 ? filteredStudyEmissions / studyTotalEmissions : 1

  const filteredPastStudies = useMemo(
    () => pastStudies.map((ps) => ({ ...ps, totalCo2: ps.totalCo2 * filterRatio })),
    [pastStudies, filterRatio],
  )

  const filteredTrajectories = useMemo(
    () =>
      trajectories.map((traj) => ({
        ...traj,
        objectives: traj.objectives.filter((obj) => {
          const hasScope = obj.sites.length > 0 || obj.subPosts.length > 0 || obj.tags.length > 0
          if (!hasScope) {
            return true
          }
          return matchesScopeFilter(
            obj.sites.map((s) => s.studySite.siteId),
            obj.subPosts.map((sp) => sp.subPost),
            obj.tags.map((tag) => tag.studyTag.id),
            selectedSiteIds,
            selectedPostIds,
            selectedTagIds,
          )
        }),
      })),
    [trajectories, selectedSiteIds, selectedPostIds, selectedTagIds],
  )

  const filteredActions = useMemo(() => {
    if (selectedSiteIds.length === 0 || selectedPostIds.length === 0 || selectedTagIds.length === 0) {
      return []
    }

    const filterSubPosts = selectedPostIds.filter((id): id is SubPost => Object.values(SubPost).includes(id as SubPost))

    return actions
      .filter((action) =>
        matchesScopeFilter(
          action.sites?.map((s) => s.studySite.siteId) ?? [],
          action.subPosts?.map((sp) => sp.subPost) ?? [],
          action.tags?.map((tag) => tag.studyTag.id) ?? [],
          selectedSiteIds,
          selectedPostIds,
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
          filterSubPosts,
          selectedTagIds,
        )
        return { ...action, reductionValueKg: action.reductionValueKg * ratio }
      })
  }, [actions, study, validatedOnly, selectedSiteIds, selectedPostIds, selectedTagIds])

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
          />
          {children({
            filteredStudyEmissions,
            filteredPastStudies,
            filteredTrajectories,
            filteredActions,
            selectedSiteIds,
            selectedPostIds,
            selectedTagIds,
          })}
        </div>
      </Block>
    </>
  )
}

export default TransitionPlanBase
