import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import ObjectivesPage from '@/components/pages/ObjectivesPage'
import { hasTransitionPlan } from '@/db/transitionPlan'
import { redirect } from 'next/navigation'

const Objectives = async ({ study, canEdit }: StudyProps & UserSessionProps & TransitionPlanProps) => {
  const studyHasTransitionPlan = await hasTransitionPlan(study.id)
  if (!studyHasTransitionPlan) {
    redirect(`/etudes/${study.id}/trajectoires`)
  }

  // TODO: Add logic to hide this page if there are no objectives yet
  return <ObjectivesPage study={study} canEdit={canEdit} />
}

export default withAuth(withStudyDetails(withTransitionPlan(Objectives)))
