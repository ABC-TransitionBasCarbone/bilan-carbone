'use client'

import { FullStudy } from '@/db/study'
import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { getEmissionsFactor } from '@/services/serverFunctions/emissionFactor'
import classNames from 'classnames'
import { User } from 'next-auth'
import { useEffect, useMemo, useState } from 'react'
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
  user: User
}

const SubPosts = ({ post, study, user, withoutDetail }: Props & (StudyProps | StudyWithoutDetailProps)) => {
  const subPosts = useMemo(() => subPostsByPost[post], [post])
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactorWithMetaData[]>([])
  useEffect(() => {
    const fetchData = async () => {
      const emissionFactors = await getEmissionsFactor()
      setEmissionFactors(emissionFactors)
    }
    fetchData()
  }, [])

  const userRoleOnStudy = useMemo(() => {
    if (withoutDetail) {
      return null
    }
    const right = study.allowedUsers.find((right) => right.user.email === user.email)
    return right ? right.role : null
  }, [study, user, withoutDetail])

  return (
    <div className={classNames(styles.subPosts, 'flex-col')}>
      {subPosts.map((subPost) => (
        <SubPost
          emissionFactors={emissionFactors}
          post={post}
          subPost={subPost}
          key={subPost}
          userRoleOnStudy={userRoleOnStudy}
          {...(withoutDetail ? { study, withoutDetail: true } : { study, withoutDetail: false })}
        />
      ))}
    </div>
  )
}

export default SubPosts
