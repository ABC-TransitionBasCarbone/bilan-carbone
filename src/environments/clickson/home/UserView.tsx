import StudiesContainer from '@/components/study/StudiesContainer'
import { default as CUTUserView } from '@/environments/cut/home/UserView'
import { UserSession } from 'next-auth'
interface Props {
  account: UserSession
}

const UserView = ({ account }: Props) => {
  if (!account.organizationVersionId) {
    return <StudiesContainer user={account} />
  }

  return <CUTUserView account={account} />
}

export default UserView
