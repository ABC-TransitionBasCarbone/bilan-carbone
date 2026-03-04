'use client'

import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { FullStudy } from '@/db/study'
import type { ActionWithRelations, TrajectoryWithObjectivesAndScope } from '@/db/transitionPlan'
import { useTransitionPlanFilters } from '@/hooks/useTransitionPlanFilters'
import { customRich } from '@/i18n/customRich'
import { getFilteredStudyEmissions, getStudyTotalCo2Emissions } from '@/services/study'
import { matchesScopeFilter } from '@/utils/scopeFilter'
import { convertToPastStudies } from '@/utils/trajectory'
import type { ExternalStudy, SectenInfo } from '@prisma/client'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import Block from '../base/Block'
import Actions from '../study/transitionPlan/Actions/Actions'
import TrajectoryGraph from '../study/transitionPlan/TrajectoryGraph'
import TransitionPlanFilters from '../study/transitionPlan/TransitionPlanFilters'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'

interface Props {
  study: FullStudy
  actions: ActionWithRelations[]
  transitionPlanId: string
  canEdit: boolean
  trajectories?: TrajectoryWithObjectivesAndScope[]
  linkedStudies?: FullStudy[]
  linkedExternalStudies?: ExternalStudy[]
  validatedOnly?: boolean
  sectenData?: SectenInfo[]
}

const ActionsPage = ({
  study,
  actions,
  transitionPlanId,
  canEdit,
  trajectories = [],
  linkedStudies = [],
  linkedExternalStudies = [],
  validatedOnly = false,
  sectenData = [],
}: Props) => {
  const t = useTranslations('study.transitionPlan.actions')
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const {
    selectedSiteIds,
    selectedPostIds,
    selectedTagIds,
    filtersMounted,
    setSelectedSiteIds,
    setSelectedPostIds,
    setSelectedTagIds,
  } = useTransitionPlanFilters(study.id)

  const sites = useMemo(() => study.sites.map((s) => ({ id: s.id, name: s.site.name })), [study.sites])

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

  const filteredActions = useMemo(
    () =>
      actions.filter((action) =>
        matchesScopeFilter(
          action.sites?.map((s) => s.studySite.siteId) ?? [],
          action.subPosts?.map((sp) => sp.subPost) ?? [],
          action.tags?.map((tag) => tag.studyTag.id) ?? [],
          selectedSiteIds,
          selectedPostIds,
          selectedTagIds,
        ),
      ),
    [actions, selectedSiteIds, selectedPostIds, selectedTagIds],
  )

  return (
    <>
      <Breadcrumbs
        current={tStudyNav('actionPlan')}
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
        title={t('title')}
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
            title={t('onboarding.title')}
            description={t('onboarding.description')}
            storageKey="actions"
            detailedContent={customRich(t, 'onboarding.detailedInfo')}
          />
          {
            <TrajectoryGraph
              study={study}
              trajectories={trajectories}
              actions={filteredActions}
              linkedStudies={linkedStudies}
              sectenData={sectenData}
              selectedSnbcTrajectories={[]}
              selectedSbtiTrajectories={[]}
              selectedCustomTrajectories={trajectories.map((tr) => tr.id)}
              pastStudies={filteredPastStudies}
              validatedOnly={validatedOnly}
              studyEmissions={filteredStudyEmissions}
              storageKey={`trajectory-page-${transitionPlanId}`}
              isTrajectoryPage
            />
          }
          <Actions
            actions={filteredActions}
            studyUnit={study.resultsUnit}
            transitionPlanId={transitionPlanId}
            canEdit={canEdit}
            studyId={study.id}
            studyRealizationStartDate={study.realizationStartDate?.toISOString() ?? ''}
            sites={sites}
            tagFamilies={study.tagFamilies}
          />
        </div>
      </Block>
    </>
  )
}

export default ActionsPage
