import Block from '@/components/base/Block'
import withAuth, { UserProps } from '@/components/hoc/withAuth'
import UserView from '@/components/home/UserView'

export const revalidate = 0

const Home = async ({ user }: UserProps) => {
  return (
    <>
      <Block>
        <UserView user={user} />
      </Block>
    </>
  )
}

export default withAuth(Home)
