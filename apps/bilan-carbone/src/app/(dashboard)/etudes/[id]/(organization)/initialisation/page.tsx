import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import TransitionPlanInitPage from '@/components/pages/TransitionPlanInitPage'
import { loadTransitionPlanPageData } from '@/components/study/transitionPlan/transitionPlanPageData'
import { getUserApplicationSettings } from '@/db/user'

const TransitionPlanInit = async ({ study, canEdit, user }: StudyProps & UserSessionProps & TransitionPlanProps) => {
  const data = await loadTransitionPlanPageData(study.id, user.accountId)

  if (!data) {
    const settings = await getUserApplicationSettings(user.accountId)

    return (
      <TransitionPlanInitPage
        study={study}
        canEdit={canEdit}
        transitionPlan={null}
        trajectories={[]}
        linkedStudies={[]}
        linkedExternalStudies={[]}
        validatedOnly={settings.validatedEmissionSourcesOnly}
        sectenData={[]}
        latestSectenVersion={null}
        isSectenOutdated={false}
      />
    )
  }

  return (
    <TransitionPlanInitPage
      study={study}
      canEdit={canEdit}
      transitionPlan={data.transitionPlan}
      trajectories={data.trajectories}
      linkedStudies={data.linkedStudies}
      linkedExternalStudies={data.linkedExternalStudies}
      validatedOnly={data.validatedOnly}
      sectenData={data.sectenData}
      latestSectenVersion={data.latestSectenVersion}
      isSectenOutdated={data.isSectenOutdated}
    />
  )
}

export default withAuth(withStudyDetails(withTransitionPlan(TransitionPlanInit)))
