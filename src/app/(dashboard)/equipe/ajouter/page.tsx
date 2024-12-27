import withAuth from '@/components/hoc/withAuth'
import NewMemberPage from '@/components/pages/NewMember'

const NewMember = () => {
  return <NewMemberPage />
}

export default withAuth(NewMember)
