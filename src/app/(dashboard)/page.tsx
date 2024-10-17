import { auth } from '@/services/auth'
import UserView from '@/components/home/UserView'

const Home = async () => {
  const session = await auth()

  if (!session) {
    return null
  }

  const { user } = session

  return (
    <>
      <h1 className="mb1">Hello {user.firstName}</h1>
      <UserView user={user} />
    </>
  )
}

export default Home
