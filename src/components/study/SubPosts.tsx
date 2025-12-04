'use client'

import { FullStudy } from '@/db/study'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { StudyRole, SubPost } from '@prisma/client'
import classNames from 'classnames'
import SubPostComponent from './SubPost'
import styles from './SubPosts.module.css'

type StudyProps = {
  study: FullStudy
  withoutDetail: false
}

type StudyWithoutDetailProps = {
  study: StudyWithoutDetail
  withoutDetail: true
}

interface Props {
  subPosts: SubPost[]
  userRole: StudyRole | null
  studySite: string
  emissionSources: FullStudy['emissionSources']
  setGlossary: (subPost: string) => void
}

const SubPosts = ({
  subPosts,
  study,
  userRole,
  withoutDetail,
  emissionSources,
  studySite,
  setGlossary,
}: Props & (StudyProps | StudyWithoutDetailProps)) => {
  return (
    <div className={classNames(styles.subPosts, 'flex-col')}>
      {subPosts.map((subPost) => (
        <SubPostComponent
          emissionSources={emissionSources.filter((emissionSource) => emissionSource.subPost === subPost)}
          subPost={subPost}
          key={subPost}
          userRoleOnStudy={userRole}
          studySite={studySite}
          {...(withoutDetail ? { study, withoutDetail: true } : { study, withoutDetail: false })}
          setGlossary={setGlossary}
        />
      ))}
    </div>
  )
}

export default SubPosts
