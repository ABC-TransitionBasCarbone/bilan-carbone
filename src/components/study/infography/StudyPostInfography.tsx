'use client'

import { FullStudy } from '@/db/study'
import PostInfography from './PostsInfography'
import styles from './StudyPostInfography.module.css'

interface Props {
  study: FullStudy
}

const StudyPostInfography = ({ study }: Props) => {
  return (
    <div className={styles.infography} id="study-post-infography">
      <PostInfography hideSubPosts study={study} />
    </div>
  )
}

export default StudyPostInfography
