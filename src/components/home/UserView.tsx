import classNames from 'classnames'
import { User } from 'next-auth'
import { Role } from '@prisma/client'
import styles from './styles.module.css'
import ResultsContainer from '../study/results/ResultsContainer'
import Actualities from '../actuality/Actualities'
import Studies from '../study/StudyContainer'

interface Props {
  user: User
}

const UserView = ({ user }: Props) => {
  return (
    <div className="flex-col">
      {user.role === Role.DEFAULT && <ResultsContainer />}
      <div className={classNames(styles.container, 'w100')}>
        <Actualities />
        <Studies user={user} />
      </div>
    </div>
  )
}

export default UserView
