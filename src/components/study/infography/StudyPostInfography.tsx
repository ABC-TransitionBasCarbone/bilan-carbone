'use client'

import { FullStudy } from '@/db/study'
import AllPostsInfography from './AllPostsInfography'
import styles from './StudyPostInfography.module.css'

interface Props {
  study: FullStudy
  site: string
}

const StudyPostInfography = ({ study, site }: Props) => {
  return (
    <div className={styles.infography} id="study-post-infography">
      <AllPostsInfography study={study} site={site} />
    </div>
  )
}

export default StudyPostInfography
