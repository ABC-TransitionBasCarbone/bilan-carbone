import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import ObjectivesPage from '@/components/pages/ObjectivesPage'
import { checkStudyHasObjectives } from '@/services/serverFunctions/trajectory'
import { redirect } from 'next/navigation'

const Objectives = async ({ study, canEdit }: StudyProps & UserSessionProps & TransitionPlanProps) => {
  const objectivesResponse = await checkStudyHasObjectives(study.id)
  const hasObjectives = objectivesResponse.success ? objectivesResponse.data : false

  if (!hasObjectives) {
    redirect(`/etudes/${study.id}/trajectoires`)
  }

  return <ObjectivesPage study={study} canEdit={canEdit} />
}

export default withAuth(withStudyDetails(withTransitionPlan(Objectives)))
