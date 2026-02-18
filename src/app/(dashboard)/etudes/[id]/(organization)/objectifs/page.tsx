import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import ObjectivesPage from '@/components/pages/ObjectivesPage'
import { getTransitionPlanByStudyId } from '@/db/transitionPlan'
import { getSectenData } from '@/services/serverFunctions/secten'
import { checkStudyHasObjectives, getTrajectories } from '@/services/serverFunctions/trajectory.serverFunction'
import { getLinkedAndExternalStudies } from '@/services/serverFunctions/transitionPlan'
import { getUserSettings } from '@/services/serverFunctions/user'
import { redirect } from 'next/navigation'

const Objectives = async ({ study, canEdit }: StudyProps & UserSessionProps & TransitionPlanProps) => {
  const hasObjectives = await checkStudyHasObjectives(study.id)
  if (!hasObjectives) {
    redirect(`/etudes/${study.id}/trajectoires`)
  }

  const transitionPlan = await getTransitionPlanByStudyId(study.id)
  if (!transitionPlan) {
    redirect(`/etudes/${study.id}/trajectoires`)
  }

  const [trajectoriesResponse, sectenDataResponse, linkedStudiesResponse, userSettingsResponse] = await Promise.all([
    getTrajectories(study.id, transitionPlan.id),
    getSectenData(),
    getLinkedAndExternalStudies(transitionPlan.id),
    getUserSettings(),
  ])

  if (!trajectoriesResponse.success || trajectoriesResponse.data.length === 0) {
    redirect(`/etudes/${study.id}/trajectoires`)
  }

  const trajectories = trajectoriesResponse.data
  const sectenData = sectenDataResponse.success ? sectenDataResponse.data : []
  const linkedStudies = linkedStudiesResponse.success ? linkedStudiesResponse.data.linkedStudies : []
  const linkedExternalStudies = linkedStudiesResponse.success ? linkedStudiesResponse.data.externalStudies : []
  const validatedOnly = userSettingsResponse.success ? !!userSettingsResponse.data?.validatedEmissionSourcesOnly : false

  return (
    <ObjectivesPage
      study={study}
      canEdit={canEdit}
      trajectories={trajectories}
      transitionPlanId={transitionPlan.id}
      sectenData={sectenData}
      linkedStudies={linkedStudies}
      linkedExternalStudies={linkedExternalStudies}
      validatedOnly={validatedOnly}
    />
  )
}

export default withAuth(withStudyDetails(withTransitionPlan(Objectives)))
