import {
  canEditTransitionPlan,
  canViewTransitionPlan,
  isFeatureTransitionPlanActive,
} from '@/services/permissions/study'
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
    const { study, user } = props

    const isTransitionPlanActive = await isFeatureTransitionPlanActive(study.organizationVersion.environment)

    if (!isTransitionPlanActive) {
      redirect(`/etudes/${study.id}`)
    }

    const canView = await canViewTransitionPlan(user, study)
    if (!canView) {
      redirect(`/etudes/${study.id}`)
    }

    const canEdit = await canEditTransitionPlan(user, study)

    return <WrappedComponent {...props} canEdit={canEdit} />
  }

  Component.displayName = 'withTransitionPlan'
  return Component
}

export default withTransitionPlan
