import { hasEditAccessOnStudy, hasReadAccessOnStudy } from '@/services/permissions/study'
import { isFeatureTransitionPlanActive } from '@/services/permissions/transitionPlan'
import { redirect } from 'next/navigation'
import React from 'react'
import { UserSessionProps } from './withAuth'
import { StudyProps } from './withStudy'

export interface TransitionPlanProps {
  canEdit: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withTransitionPlan = (WrappedComponent: React.ComponentType<any & UserSessionProps & StudyProps>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = async (props: any & UserSessionProps & StudyProps) => {
    const { study } = props

    const isTransitionPlanActive = await isFeatureTransitionPlanActive(study.organizationVersion.environment)

    if (!isTransitionPlanActive) {
      redirect(`/etudes/${study.id}`)
    }

    const canView = await hasReadAccessOnStudy(study.id)
    if (!canView) {
      redirect(`/etudes/${study.id}`)
    }

    const canEdit = await hasEditAccessOnStudy(study.id)

    return <WrappedComponent {...props} canEdit={canEdit} />
  }

  Component.displayName = 'withTransitionPlan'
  return Component
}

export default withTransitionPlan
