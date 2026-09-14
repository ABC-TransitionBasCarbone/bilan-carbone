import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudyDetails, { StudyProps } from '@/components/hoc/withStudyDetails'
import EditStudyContributorPage from '@/components/pages/EditStudyContributor'
import { getAccountById } from '@/db/account'
import { NEWGetAccountRoleOnStudy } from '@/services/serverFunctions/study'
import { AccountWithUser } from '@/types/account.types'
import { hasEditionRights } from '@/utils/study'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{
    accountId: string
  }>
}

const EditStudyContributor = async ({ study, user, params, studyId }: StudyProps & UserSessionProps & Props) => {
  const userRoleOnStudy = await NEWGetAccountRoleOnStudy(user, studyId)
  if (!userRoleOnStudy.success) {
    return <NotFound />
  }

  if (!hasEditionRights(userRoleOnStudy.data)) {
    redirect(`/etudes/${studyId}/cadrage`)
  }

  const { accountId } = await params
  if (!accountId) {
    return <NotFound />
  }

  const account = accountId ? ((await getAccountById(accountId)) as AccountWithUser) : null
  if (!account) {
    return <NotFound />
  }

  const subPosts = study.contributors
    .filter((studyContributor) => studyContributor.accountId === accountId)
    .map((studyContributor) => studyContributor.subPost)

  return <EditStudyContributorPage study={study} account={account} subPosts={subPosts} />
}

export default withAuth(withStudyDetails(EditStudyContributor))
