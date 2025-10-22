import withAuth from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan, { TransitionPlanProps } from '@/components/hoc/withTransitionPlan'
import ActionsPage from '@/components/pages/ActionsPage'
import NotFound from '@/components/pages/NotFound'
import { hasTransitionPlan } from '@/db/transitionPlan'
import { getStudyOrganizationMembers } from '@/services/serverFunctions/study'
import { getStudyActions, getStudyTransitionPlan } from '@/services/serverFunctions/transitionPlan'
import { uniqBy } from '@/utils/array'
import { redirect } from 'next/navigation'

const Actions = async ({ study, canEdit }: StudyProps & TransitionPlanProps) => {
  const studyHasTransitionPlan = await hasTransitionPlan(study.id)
  if (!studyHasTransitionPlan) {
    redirect(`/etudes/${study.id}/trajectoires`)
  }

  const [transitionPlan, organizationMembers, actions] = await Promise.all([
    getStudyTransitionPlan(study.id),
    getStudyOrganizationMembers(study.id),
    getStudyActions(study.id),
  ])

  const mappedOrganizationMembers = organizationMembers.success
    ? organizationMembers.data.map((organizationMember) => organizationMember.user)
    : []

  const porters = mappedOrganizationMembers
    .concat(study.allowedUsers.map((allowedUser) => allowedUser.account.user))
    .map((user) => ({
      label: `${user.firstName} ${user.lastName.toUpperCase()} - ${user.email}`,
      value: user.email,
    }))

  if (!actions.success || !transitionPlan.success || !transitionPlan.data) {
    return <NotFound />
  }

  return (
    <ActionsPage
      study={study}
      actions={actions.data}
      porters={uniqBy(porters, 'value')}
      transitionPlanId={transitionPlan.data.id}
    />
  )
}

export default withAuth(withStudyDetails(withTransitionPlan(Actions)))
