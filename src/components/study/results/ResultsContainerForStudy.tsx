import Box from '@/components/base/Box'
import { FullStudy } from '@/db/study'
import Result from './Result'
import styles from './ResultsContainer.module.css'

interface Props {
  study: FullStudy
  site: string
}

const ResultsContainerForStudy = ({ study, site }: Props) => {
  return (
    <Box>
      <h2 className={styles.studyName}>{study.name}</h2>
      <div className={styles.container}>
        <div className={styles.graph}>
          <Result study={study} by="Post" site={site} />
        </div>
        <div className={styles.separatorContainer}>
          <div className={styles.separator} />
        </div>
        <div className={styles.graph}>
          <Result study={study} by="SubPost" site={site} />
        </div>
      </div>
    </Box>
  )
}

export default ResultsContainerForStudy
