import Block from '@/components/base/Block'
import UserView from '@/components/home/UserView'
import { auth } from '@/services/auth'

export const revalidate = 0

const Home = async () => {
  const session = await auth()

  if (!session) {
    return null
  }

  const { user } = session

  return (
    <>
      <Block>
        <UserView user={user} />
      </Block>
    </>
  )
}

export default Home
