'use client'

import TransitionPlanBase from '@/components/study/transitionPlan/TransitionPlanBase'
import type { FullStudy } from '@/db/study'
import type { ActionWithRelations, TrajectoryWithObjectivesAndScope } from '@/db/transitionPlan'
import { customRich } from '@/i18n/customRich'
import type { ExternalStudy, SectenInfo } from '@repo/db-common'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import Actions from '../study/transitionPlan/Actions/Actions'

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
  const tStudyNav = useTranslations('study.navigation')

  const sites = useMemo(() => study.sites.map((s) => ({ id: s.id, name: s.site.name })), [study.sites])

  return (
    <TransitionPlanBase
      study={study}
      canEdit={canEdit}
      transitionPlanId={transitionPlanId}
      trajectories={trajectories}
      actions={actions}
      linkedStudies={linkedStudies}
      linkedExternalStudies={linkedExternalStudies}
      validatedOnly={validatedOnly}
      sectenData={sectenData}
      breadcrumbCurrent={tStudyNav('actionPlan')}
      blockTitle={t('title')}
      onboardingTitle={t('onboarding.title')}
      onboardingDescription={customRich(t, 'onboarding.description')}
      onboardingStorageKey="actions"
      onboardingDetailedContent={customRich(t, 'onboarding.detailedInfo')}
    >
      {({ filteredActions }) => (
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
      )}
    </TransitionPlanBase>
  )
}

export default ActionsPage
