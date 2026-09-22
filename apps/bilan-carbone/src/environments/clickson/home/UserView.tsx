import StudiesContainer from '@/components/study/StudiesContainer'
import { default as SimplifiedUserView } from '@/environments/simplified/home/UserView'
import { UserSession } from 'next-auth'

interface Props {
  account: UserSession
  feedbackFormUrl?: string
}

const UserView = async ({ account, feedbackFormUrl }: Props) => {
  if (!account.organizationVersionId) {
    return <StudiesContainer user={account} feedbackFormUrl={feedbackFormUrl} />
  }
  return <SimplifiedUserView account={account} feedbackFormUrl={feedbackFormUrl} />
}

export default UserView
