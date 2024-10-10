import Actualities from '@/components/actuality/Actualities'
import { getAllActualities } from '@/db/actuality'

const Home = async () => {
  const actualities = await getAllActualities()
  return (
    <>
      <h1>Hello World</h1>
      <Actualities actualities={actualities} />
    </>
  )
}

export default Home
