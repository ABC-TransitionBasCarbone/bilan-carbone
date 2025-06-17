import Block from '@/components/base/Block'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import UserView from '@/components/home/UserView'

export const revalidate = 0

const Home = async ({ user: account }: UserSessionProps) => {
  return (
    <>
      <Block>
        <UserView account={account} />
      </Block>
    </>
  )
}

export default withAuth(Home)
