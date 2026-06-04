import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import CommentManagementPage from '@/components/pages/CommentManagementPage'
import { hasAccessToStudyComments } from '@/services/permissions/environment'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'

export const revalidate = 0

const CommentManagement = async ({ user }: UserSessionProps) => {
  if (!user.organizationVersionId || !hasAccessToStudyComments(user.environment)) {
    return <NotFound />
  }

  return <CommentManagementPage organizationVersionId={user.organizationVersionId} />
}

export default withAuth(CommentManagement)
