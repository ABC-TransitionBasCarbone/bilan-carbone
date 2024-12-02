'use server'

import { FullStudy } from '@/db/study'
import classNames from 'classnames'
import Result from './Result'
import styles from './ResultsContainer.module.css'

interface Props {
  study: FullStudy
}

const ResultsContainerForStudy = async ({ study }: Props) => {
  return (
    <div className="pb1">
      <div className={classNames(styles.container, 'flex')}>
        <Result study={study} isPost />
        <Result study={study} isPost={false} />
      </div>
    </div>
  )
}

export default ResultsContainerForStudy
