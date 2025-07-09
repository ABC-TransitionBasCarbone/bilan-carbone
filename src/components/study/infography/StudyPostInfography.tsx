'use client'

import { FullStudy } from '@/db/study'
import { Environment } from '@prisma/client'
import AllPostsInfographyContainer from './AllPostsInfographyContainer'
import styles from './StudyPostInfography.module.css'

interface Props {
  study: FullStudy
  studySite: string
  environment: Environment
}

const StudyPostInfography = ({ study, studySite, environment }: Props) => {
  return (
    <div className={styles.infography} id="study-post-infography">
      <AllPostsInfographyContainer study={study} studySite={studySite} environment={environment} />
    </div>
  )
}

export default StudyPostInfography
