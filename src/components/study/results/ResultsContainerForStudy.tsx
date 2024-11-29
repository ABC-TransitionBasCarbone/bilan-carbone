'use server'

import { FullStudy } from '@/db/study'
import { getEmissionsFactor } from '@/services/serverFunctions/emissionFactor'
import classNames from 'classnames'
import Result from './Result'
import styles from './ResultsContainer.module.css'

interface Props {
  study: FullStudy
}

const ResultsContainerForStudy = async ({ study }: Props) => {
  const emissionFactors = await getEmissionsFactor()
  return (
    <div className="pb1">
      <div className={classNames(styles.container, 'flex')}>
        <Result emissionFactors={emissionFactors} study={study} isPost />
        <Result emissionFactors={emissionFactors} study={study} isPost={false} />
      </div>
    </div>
  )
}

export default ResultsContainerForStudy
