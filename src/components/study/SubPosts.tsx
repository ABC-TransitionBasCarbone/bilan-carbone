'use client'

import { FullStudy } from '@/db/study'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { EmissionFactorWithMetaData, getEmissionFactors } from '@/services/serverFunctions/emissionFactor'
import { EmissionFactorStatus, StudyRole } from '@prisma/client'
import classNames from 'classnames'
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
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactorWithMetaData[]>([])
  useEffect(() => {
    const fetchData = async () => {
      const emissionFactorsData = await getEmissionFactors(study.id)
      const emissionFactors = emissionFactorsData.success ? emissionFactorsData.data : []
      setEmissionFactors(
        emissionFactors.filter((emissionFactor) => emissionFactor.status !== EmissionFactorStatus.Archived),
      )
    }
    fetchData()
  }, [])

  return (
    <div className={classNames(styles.subPosts, 'flex-col')}>
      {subPosts.map((subPost) => (
        <SubPost
          emissionFactors={emissionFactors}
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
