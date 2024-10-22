import classNames from 'classnames'
import { User } from 'next-auth'
import { Role } from '@prisma/client'
import styles from './styles.module.css'
import ResultsContainer from '../study/results/ResultsContainer'
import Actualities from '../actuality/Actualities'
import Studies from '../study/StudyContainer'
import { getAllActualities } from '@/db/actuality'
import { getStudyByUser } from '@/db/study'

interface Props {
  user: User
}

const UserView = async ({ user }: Props) => {
  const actualities = await getAllActualities()
  const studies = await getStudyByUser(user)

  return (
    <div className="flex-col">
      {user.role === Role.DEFAULT && <ResultsContainer />}
      <div className={classNames(styles.container, 'w100')}>
        <Actualities actualities={actualities} />
        <Studies studies={studies} role={user.role} />
      </div>
    </div>
  )
}

export default UserView
