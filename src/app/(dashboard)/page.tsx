import Block from '@/components/base/Block'
import withAuth, { AccountProps } from '@/components/hoc/withAuth'
import UserView from '@/components/home/UserView'

export const revalidate = 0

const Home = async ({ user: account }: AccountProps) => {
  return (
    <>
      <Block>
        <UserView account={account} />
      </Block>
    </>
  )
}

export default withAuth(Home)
