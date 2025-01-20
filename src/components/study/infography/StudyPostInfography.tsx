'use client'

import { FullStudy } from '@/db/study'
import AllPostsInfography from './AllPostsInfography'
import styles from './StudyPostInfography.module.css'

interface Props {
  study: FullStudy
  studySite: string
}

const StudyPostInfography = ({ study, studySite }: Props) => {
  return (
    <div className={styles.infography} id="study-post-infography">
      <AllPostsInfography study={study} studySite={studySite} />
    </div>
  )
}

export default StudyPostInfography
