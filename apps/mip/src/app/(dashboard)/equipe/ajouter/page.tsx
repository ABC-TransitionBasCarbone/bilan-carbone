import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'

const NewMember = ({ user }: UserSessionProps) => {
  return <p>New Member </p>
}

export default withAuth(NewMember)
