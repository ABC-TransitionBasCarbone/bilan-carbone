'use server'

import { getMainStudy } from '@/db/study'
import { canReadStudy } from '@/services/permissions/study'
import { getEmissionsFactor } from '@/services/serverFunctions/emissionFactor'
import classNames from 'classnames'
import { User } from 'next-auth'
import Result from './Result'
import styles from './ResultsContainer.module.css'

interface Props {
  user: User
}

const ResultsContainerForUser = async ({ user }: Props) => {
  const study = await getMainStudy(user)
  const emissionFactors = await getEmissionsFactor()
  const showResults = study && (await canReadStudy(user, study))

  return showResults ? (
    <div className="pb1">
      <div className={classNames(styles.container, 'flex')}>
        <Result emissionFactors={emissionFactors} study={study} isPost />
        <Result emissionFactors={emissionFactors} study={study} isPost={false} />
      </div>
    </div>
  ) : null
}

export default ResultsContainerForUser
