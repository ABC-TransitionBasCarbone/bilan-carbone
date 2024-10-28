import classNames from 'classnames'
import { User } from 'next-auth'
import { Role } from '@prisma/client'
import styles from './styles.module.css'
import ResultsContainer from '../study/results/ResultsContainer'
import Actualities from '../actuality/Actualities'
import Studies from '../study/StudyContainer'
import { getAllActualities } from '@/db/actuality'
import { getStudyByUser } from '@/db/study'
import { getUserByEmailWithAllowedStudies } from '@/db/user'
import { canReadStudy } from '@/services/permissions/study'

interface Props {
  user: User
}

const UserView = async ({ user }: Props) => {
  const actualities = await getAllActualities()
  const studies = await getStudyByUser(user)
  const userWithAllowedStudies = await getUserByEmailWithAllowedStudies(user.email)
  const allowedStudies = studies.filter(async (study) => await canReadStudy(userWithAllowedStudies, study))
  return (
    <div className="flex-col">
      {user.role === Role.DEFAULT && <ResultsContainer />}
      <div className={classNames(styles.container, 'w100')}>
        <Actualities actualities={actualities} />
        <Studies studies={allowedStudies} role={user.role} />
      </div>
    </div>
  )
}

export default UserView
