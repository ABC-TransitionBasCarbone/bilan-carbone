import { Study } from '@prisma/client'
import Block from '../base/Block'
import dayjs from 'dayjs'
import styles from "./StudyDetails.module.css"
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ResultsContainerForStudy from './results/ResultsContainerForStudy'

interface Props {
  study: Study
}

const StudyDetails = async ({ study }: Props) => {  
  const datesInfo = `${dayjs(study.startDate).format("DD/MM/YYYY")} - ${dayjs(study.endDate).format("DD/MM/YYYY")}`;

  return (
    <Block title={study.name} as="h1" noSpace postTitleIcon={study.isPublic ? <LockIcon /> : <LockOpenIcon />}>
      <span className={styles.studyInfo}>
        <div>{datesInfo}</div>
        <div>Exports : {study.exports.map((e) => e.type).join(", ")}</div>
      </span>
      <div className={styles.graphsContainer}>
        <ResultsContainerForStudy study={study} />
      </div>
    </Block>
  )
}

export default StudyDetails
