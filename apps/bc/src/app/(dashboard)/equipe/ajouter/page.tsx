import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NewMemberPage from '@/components/pages/NewMember'
import { canEditMemberRole } from '@/utils/user'
import NotFound from '@abc-transitionbascarbone/common/components/pages/NotFound'

const NewMember = ({ user }: UserSessionProps) => {
  if (!canEditMemberRole(user)) {
    return <NotFound />
  }
  return <NewMemberPage user={user} />
}

export default withAuth(NewMember)
