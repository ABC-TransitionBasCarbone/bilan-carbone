import { auth } from '@/services/auth'
import UserView from '@/components/home/UserView'
import Block from '@/components/base/Block'

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
