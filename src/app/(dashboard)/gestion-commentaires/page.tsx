import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import CommentManagementPage from '@/components/pages/CommentManagementPage'
import NotFound from '@/components/pages/NotFound'
import { hasAccessToStudyComments } from '@/services/permissions/environment'

export const revalidate = 0

const CommentManagement = async ({ user }: UserSessionProps) => {
  if (!user.organizationVersionId || !hasAccessToStudyComments(user.environment)) {
    return <NotFound />
  }

  return <CommentManagementPage organizationVersionId={user.organizationVersionId} />
}

export default withAuth(CommentManagement)
