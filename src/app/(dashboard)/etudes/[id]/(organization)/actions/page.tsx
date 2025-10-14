import withAuth from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import withTransitionPlan from '@/components/hoc/withTransitionPlan'
import ActionsPage from '@/components/pages/ActionsPage'
import { hasTransitionPlan } from '@/db/transitionPlan'
import { getStudyOrganizationMembers } from '@/services/serverFunctions/study'
import { getStudyTransitionPlan } from '@/services/serverFunctions/transitionPlan'
import { uniqBy } from '@/utils/array'
import { redirect } from 'next/navigation'

const Actions = async ({ study }: StudyProps) => {
  const studyHasTransitionPlan = await hasTransitionPlan(study.id)
  if (!studyHasTransitionPlan) {
    redirect(`/etudes/${study.id}/trajectoires`)
  }

  const [transitionPlan, organizationMembers] = await Promise.all([
    getStudyTransitionPlan(study),
    getStudyOrganizationMembers(study.id),
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

  return <ActionsPage study={study} porters={uniqBy(porters, 'value')} />
}

export default withAuth(withStudyDetails(withTransitionPlan(Actions)))
