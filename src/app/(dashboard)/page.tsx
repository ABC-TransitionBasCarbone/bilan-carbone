import classNames from 'classnames'
import styles from './styles.module.css'
import Actualities from '@/components/actuality/Actualities'
import StudyPage from '@/components/pages/Study'
import { getAllActualities } from '@/db/actuality'
import { getStudyByUser } from '@/db/study'
import { auth } from '@/services/auth'

const Home = async () => {
  const session = await auth()

  if (!session) {
    return null
  }

  const actualities = await getAllActualities()
  const studies = await getStudyByUser(session.user)

  return (
    <>
      <h1>Hello {session?.user.firstName}</h1>
      <div className="flex-col">
        <div>
          <div></div>
          <div></div>
        </div>
        <div className={classNames(styles.container, 'w100')}>
          <Actualities actualities={actualities} />
          <StudyPage studies={studies}></StudyPage>
        </div>
      </div>
    </>
  )
}

export default Home
