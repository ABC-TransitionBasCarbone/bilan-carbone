import StudiesContainer from '@/components/study/StudiesContainer'
import { default as SimplifiedUserView } from '@/environments/simplified/home/UserView'
import { UserSession } from 'next-auth'
interface Props {
  account: UserSession
}

const UserView = ({ account }: Props) => {
  if (!account.organizationVersionId) {
    return <StudiesContainer user={account} />
  }

  return <SimplifiedUserView account={account} />
}

export default UserView
