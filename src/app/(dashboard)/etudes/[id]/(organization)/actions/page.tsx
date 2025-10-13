import withAuth from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan from '@/components/hoc/withTransitionPlan'
import ActionsPage from '@/components/pages/ActionsPage'
import { hasTransitionPlan } from '@/db/transitionPlan'
import { redirect } from 'next/navigation'

const Actions = async ({ study }: StudyProps) => {
  const studyHasTransitionPlan = await hasTransitionPlan(study.id)
  if (!studyHasTransitionPlan) {
    redirect(`/etudes/${study.id}/trajectoires`)
  }

  return <ActionsPage study={study} />
}

export default withAuth(withStudyDetails(withTransitionPlan(Actions)))
