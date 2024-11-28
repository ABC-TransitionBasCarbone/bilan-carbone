import { FullStudy } from '@/db/study'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { getFormatter } from 'next-intl/server'
import Block from '../base/Block'
import ResultsContainerForStudy from './results/ResultsContainerForStudy'
import styles from './StudyDetails.module.css'
import DownloadEmissionSourcesButton from './StudyDownloadEmissionSourcesButton'

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
        Buttons={<DownloadEmissionSourcesButton study={study} />}
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
