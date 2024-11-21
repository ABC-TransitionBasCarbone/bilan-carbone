import Block from '../base/Block'
import styles from './StudyDetails.module.css'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import ResultsContainerForStudy from './results/ResultsContainerForStudy'
import { FullStudy } from '@/db/study'
import { getFormatter } from 'next-intl/server'

interface Props {
  study: FullStudy
}

const StudyDetails = async ({ study }: Props) => {
  const format = await getFormatter()

  return (
    <>
      <Block
        title={study.name}
        as="h1"
        icon={study.isPublic ? <LockOpenIcon /> : <LockIcon />}
        description={
          <div className={styles.studyInfo}>
            <p>
              {format.dateTime(study.startDate, { year: 'numeric', day: 'numeric', month: 'long' })} -{' '}
              {format.dateTime(study.endDate, { year: 'numeric', day: 'numeric', month: 'long' })}
            </p>
            <p>Exports : {study.exports.map((e) => e.type).join(', ')}</p>
          </div>
        }
      />
      <Block>
        <ResultsContainerForStudy />
      </Block>
    </>
  )
}

export default StudyDetails
