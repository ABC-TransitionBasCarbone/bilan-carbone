'use client'

import { FullStudy } from '@/db/study'
import AllPostsInfographyContainer from './AllPostsInfographyContainer'
import styles from './StudyPostInfography.module.css'

interface Props {
  study: FullStudy
  siteId: string
  studySiteId: string
}

const StudyPostInfography = ({ study, siteId, studySiteId }: Props) => {
  return (
    <div className={styles.infography} id="study-post-infography">
      <AllPostsInfographyContainer study={study} studySiteId={studySiteId} siteId={siteId} />
    </div>
  )
}

export default StudyPostInfography
