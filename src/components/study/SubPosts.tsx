'use client'

import { FullStudy } from '@/db/study'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { StudyRole } from '@prisma/client'
import classNames from 'classnames'
import { useMemo } from 'react'
import SubPost from './SubPost'
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
  post: Post
  userRole: StudyRole | null
  studySite: string
  emissionSources: FullStudy['emissionSources']
  setGlossary: (subPost: string) => void
}

const SubPosts = ({
  post,
  study,
  userRole,
  withoutDetail,
  emissionSources,
  studySite,
  setGlossary,
}: Props & (StudyProps | StudyWithoutDetailProps)) => {
  const subPosts = useMemo(() => subPostsByPost[post], [post])

  return (
    <div className={classNames(styles.subPosts, 'flex-col')}>
      {subPosts.map((subPost) => (
        <SubPost
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
