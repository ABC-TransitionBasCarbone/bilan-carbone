import Block from '@/components/base/Block'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import UserView from '@/components/home/UserView'
import { redirect } from 'next/navigation'

export const revalidate = 0

const Home = async ({ user: account }: UserSessionProps) => {
  if (account) {
    const needsAccountSelection = account?.needsAccountSelection
    if (needsAccountSelection) {
      redirect('/selection-du-compte')
    }
  }
  return (
    <>
      <Block>
        <UserView account={account} />
      </Block>
    </>
  )
}

export default withAuth(Home)
