import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import withStudyDetails from '@/components/hoc/withStudyDetails'
import EditStudyContributorPage from '@/components/pages/EditStudyContributor'
import NotFound from '@/components/pages/NotFound'
import { AccountWithUser, getAccountById } from '@/db/account'
import { getAccountRoleOnStudy, hasEditionRights } from '@/utils/study'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{
    accountId: string
  }>
}

const EditStudyContributor = async ({ study, user, params }: StudyProps & UserSessionProps & Props) => {
  const userRoleOnStudy = await getAccountRoleOnStudy(user, study)
  if (!hasEditionRights(userRoleOnStudy)) {
    redirect(`/etudes/${study.id}/cadrage`)
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
