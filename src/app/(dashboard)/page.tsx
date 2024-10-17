import classNames from 'classnames'
import styles from './styles.module.css'
import Actualities from '@/components/actuality/Actualities'
import Studies from '@/components/study/StudyContainer'
import ResultsContainer from '@/components/study/results/ResultsContainer'
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
      <h1 className="mb1">Hello {session?.user.firstName}</h1>
      <div className="flex-col">
        <ResultsContainer />
        <div className={classNames(styles.container, 'w100')}>
          <Actualities actualities={actualities} />
          <Studies studies={studies}></Studies>
        </div>
      </div>
    </>
  )
}

export default Home
