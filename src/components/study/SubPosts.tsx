'use client'

import { FullStudy } from '@/db/study'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { EmissionFactorWithMetaData, getEmissionFactors } from '@/services/serverFunctions/emissionFactor'
import { getUserRoleOnStudy } from '@/utils/study'
import { EmissionFactorStatus } from '@prisma/client'
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
  studySite: string
  emissionSources: FullStudy['emissionSources']
}

const SubPosts = ({
  post,
  study,
  user,
  withoutDetail,
  emissionSources,
  studySite,
}: Props & (StudyProps | StudyWithoutDetailProps)) => {
  const subPosts = useMemo(() => subPostsByPost[post], [post])
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactorWithMetaData[]>([])
  useEffect(() => {
    const fetchData = async () => {
      const emissionFactors = await getEmissionFactors(study.id)
      setEmissionFactors(
        emissionFactors.filter((emissionFactor) => emissionFactor.status !== EmissionFactorStatus.Archived),
      )
    }
    fetchData()
  }, [])

  const userRoleOnStudy = useMemo(() => {
    if (withoutDetail) {
      return null
    }
    return getUserRoleOnStudy(user, study)
  }, [study, user, withoutDetail])

  return (
    <div className={classNames(styles.subPosts, 'flex-col')}>
      {subPosts.map((subPost) => (
        <SubPost
          emissionFactors={emissionFactors}
          emissionSources={emissionSources.filter((emissionSource) => emissionSource.subPost === subPost)}
          subPost={subPost}
          key={subPost}
          userRoleOnStudy={userRoleOnStudy}
          studySite={studySite}
          {...(withoutDetail ? { study, withoutDetail: true } : { study, withoutDetail: false })}
        />
      ))}
    </div>
  )
}

export default SubPosts
