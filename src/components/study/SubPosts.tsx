'use client'

import { FullStudy } from '@/db/study'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { Post } from '@/services/posts'
import { StudyRole, SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  post: Post
  subPosts: SubPost[]
  userRole: StudyRole | null
  studySite: string
  emissionSources: FullStudy['emissionSources']
  setGlossary: (subPost: string) => void
  hasFilter?: boolean
}

const SubPosts = ({
  post,
  subPosts,
  study,
  userRole,
  withoutDetail,
  emissionSources,
  studySite,
  setGlossary,
  hasFilter,
}: Props & (StudyProps | StudyWithoutDetailProps)) => {
  const searchParams = useSearchParams()
  const [scroll, setScroll] = useState<string | null>(null)

  useEffect(() => {
    const scrollTo = searchParams.get('scrollTo')
    if (scrollTo !== null) {
      setScroll(scrollTo)
    }
  }, [searchParams])

  useEffect(() => {
    if (scroll) {
      const el = document.getElementById(`subpost-${scroll}`)
      if (!el) {
        return
      }

      el.scrollIntoView()
      // take header's height into account
      const headerHeight = getComputedStyle(document.documentElement).getPropertyValue('--header-height').trim()
      const offset = parseFloat(headerHeight) * parseFloat(getComputedStyle(document.documentElement).fontSize)
      window.scrollBy(0, -offset)
    }
  }, [scroll])

  return (
    <div className={classNames(styles.subPosts, 'flex-col')}>
      {subPosts.map((subPost) => (
        <SubPostComponent
          emissionSources={emissionSources.filter((emissionSource) => emissionSource.subPost === subPost)}
          post={post}
          subPost={subPost}
          key={subPost}
          userRoleOnStudy={userRole}
          studySite={studySite}
          {...(withoutDetail ? { study, withoutDetail: true } : { study, withoutDetail: false })}
          setGlossary={setGlossary}
          count={emissionSources.filter((emissionSource) => emissionSource.subPost === subPost).length}
          validated={
            emissionSources.filter((emissionSource) => emissionSource.subPost === subPost && emissionSource.validated)
              .length
          }
          hasFilter={!!hasFilter}
          defaultOpen={scroll === subPost}
        />
      ))}
    </div>
  )
}

export default SubPosts
