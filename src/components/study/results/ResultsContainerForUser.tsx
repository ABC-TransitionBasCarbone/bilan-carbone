'use server'

import { getMainStudy } from '@/db/study'
import { canReadStudy } from '@/services/permissions/study'
import classNames from 'classnames'
import { User } from 'next-auth'
import Result from './Result'
import styles from './ResultsContainer.module.css'

interface Props {
  user: User
}

const ResultsContainerForUser = async ({ user }: Props) => {
  const study = await getMainStudy(user)
  const showResults = study && (await canReadStudy(user, study))

  return showResults ? (
    <div className="pb1">
      <div className={classNames(styles.container, 'wrap')}>
        <Result study={study} by="Post" site="all" />
        <Result study={study} by="SubPost" site="all" />
      </div>
    </div>
  ) : null
}

export default ResultsContainerForUser
