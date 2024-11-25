'use client'

import { FullStudy } from '@/db/study'
import AllPostsInfography from './AllPostsInfography'
import styles from './StudyPostInfography.module.css'

interface Props {
  study: FullStudy
}

const StudyPostInfography = ({ study }: Props) => {
  return (
    <div className={styles.infography} id="study-post-infography">
      <AllPostsInfography study={study} />
    </div>
  )
}

export default StudyPostInfography
