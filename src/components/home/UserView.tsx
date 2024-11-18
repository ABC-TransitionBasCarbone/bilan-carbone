import classNames from 'classnames'
import { User } from 'next-auth'
import styles from './styles.module.css'
import ResultsContainer from '../study/results/ResultsContainer'
import Actualities from '../actuality/Actualities'
import Studies from '../study/StudiesContainer'
import { Suspense } from 'react'

interface Props {
  user: User
}

const UserView = ({ user }: Props) => {
  return (
    <div className="flex-col">
      <Suspense>
        <ResultsContainer user={user} />
      </Suspense>
      <div className={classNames(styles.container, 'w100')}>
        <Actualities />
        <Studies user={user} />
      </div>
    </div>
  )
}

export default UserView
