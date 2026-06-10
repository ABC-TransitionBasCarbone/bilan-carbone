import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NewMemberPage from '@/components/pages/NewMember'

const NewMember = ({ user }: UserSessionProps) => {
  return <NewMemberPage user={user} />
}

export default withAuth(NewMember)
