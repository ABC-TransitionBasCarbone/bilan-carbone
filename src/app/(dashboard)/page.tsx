import { auth } from '@/services/auth'
import UserView from '@/components/home/UserView'
import Block from '@/components/base/Block'

const Home = async () => {
  const session = await auth()

  if (!session) {
    return null
  }

  const { user } = session

  return (
    <>
      <Block title={`Hello ${user.firstName}`} as="h1">
        <UserView user={user} />
      </Block>
    </>
  )
}

export default Home
