import Actualities from '@/components/actuality/Actualities'
import { getAllActualities } from '@/db/actuality'
import { auth } from '@/services/auth'

const Home = async () => {
  const session = await auth()

  const actualities = await getAllActualities()
  return (
    <>
      <h1>Hello {session?.user.firstName}</h1>
      <Actualities actualities={actualities} />
    </>
  )
}

export default Home
