'use client'

import { FullStudy } from '@/db/study'
import { UserSession } from 'next-auth'
import AllPostsInfographyContainer from './AllPostsInfographyContainer'
import styles from './StudyPostInfography.module.css'

interface Props {
  study: FullStudy
  studySite: string
  user: UserSession
}

const StudyPostInfography = ({ study, studySite, user }: Props) => {
  return (
    <div className={styles.infography} id="study-post-infography">
      <AllPostsInfographyContainer study={study} studySite={studySite} user={user} />
    </div>
  )
}

export default StudyPostInfography
