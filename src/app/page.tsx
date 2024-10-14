import Actualities from '@/components/actuality/Actualities'
import { getAllActualities } from '@/db/actuality'
import { auth } from '@/services/auth'
import Link from 'next/link'

const Home = async () => {
  const session = await auth()

  const actualities = await getAllActualities()
  return (
    <>
      <Link href="/logout">Logout</Link>
      <Link href="/etudes/creer">Nouvelle Étude</Link>
      <h1>Hello {session?.user.firstName}</h1>
      <Actualities actualities={actualities} />
    </>
  )
}

export default Home
