import { FullStudy } from '@/db/study'
import classNames from 'classnames'
import Result from './Result'
import styles from './ResultsContainer.module.css'

interface Props {
  study: FullStudy
  site: string
}

const ResultsContainerForStudy = ({ study, site }: Props) => {
  return (
    <div className="pb1">
      <div className={classNames(styles.container, 'wrap')}>
        <Result study={study} by="Post" site={site} />
        <Result study={study} by="SubPost" site={site} />
      </div>
    </div>
  )
}

export default ResultsContainerForStudy
