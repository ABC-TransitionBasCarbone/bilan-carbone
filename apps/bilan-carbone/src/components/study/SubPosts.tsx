'use client'

import type { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { StudyRole, SubPost } from '@repo/db-common/enums'
import classNames from 'classnames'
import { SessionProvider } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import SubPostComponent from './SubPost'
import styles from './SubPosts.module.css'

type StudyProps = {
  study: FullStudy
  withoutDetail: boolean
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
}: Props & StudyProps) => {
  const searchParams = useSearchParams()
  const [scroll, setScroll] = useState<string | null>(null)

  useEffect(() => {
    const scrollTo = searchParams.get('scrollTo')
    if (scrollTo !== null) {
      // open subpost
      setScroll(scrollTo)

      // scroll to subpost
      const el = document.getElementById(`subpost-${scrollTo}`)
      if (!el) {
        return
      }

      el.scrollIntoView()
      // take header's height into account
      const headerHeight = getComputedStyle(document.documentElement).getPropertyValue('--header-height').trim()
      const offset = parseFloat(headerHeight) * parseFloat(getComputedStyle(document.documentElement).fontSize)
      window.scrollBy(0, -offset)
    }
  }, [searchParams])

  return (
    <SessionProvider>
      <div className={classNames(styles.subPosts, 'flex-col')}>
        {subPosts.map((subPost) => (
          <SubPostComponent
            emissionSources={emissionSources.filter((emissionSource) => emissionSource.subPost === subPost)}
            post={post}
            subPost={subPost}
            key={subPost}
            userRoleOnStudy={userRole}
            studySite={studySite}
            withoutDetail={withoutDetail}
            study={study}
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
    </SessionProvider>
  )
}

export default SubPosts
