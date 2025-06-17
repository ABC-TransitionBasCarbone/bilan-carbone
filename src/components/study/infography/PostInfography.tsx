'use client'

import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { CutPostHeader } from '@/environments/cut/study/infography/PostHeader'
import { Post, subPostsByPost } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { postColors } from '@/utils/study'
import { Environment, StudyResultUnit, SubPost } from '@prisma/client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PostHeader } from './PostHeader'
import { StyledLink } from './PostInfography'
import { SubPostInfography } from './SubPostInfography'

interface Props {
  post: Post | SubPost
  data?: ResultsByPost
  studyId: string
  resultsUnit: StudyResultUnit
}

const PostInfography = ({ post, data, studyId, resultsUnit }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const [displayChildren, setDisplayChildren] = useState(false)
  const displayTimeout = useRef<NodeJS.Timeout | null>(null)

  const mainPost = useMemo(() => {
    if (Object.keys(Post).includes(post)) {
      return post as Post
    } else {
      const entry = Object.entries(subPostsByPost).find(([, subPosts]) => subPosts.includes(post as SubPost))
      return entry ? (entry[0] as Post) : null
    }
  }, [post])

  const postColor = useMemo(() => (mainPost ? postColors[mainPost] : 'green'), [mainPost])

  const percent = useMemo(() => {
    const percent =
      !data || data.numberOfEmissionSource === 0
        ? 0
        : (data.numberOfValidatedEmissionSource / data.numberOfEmissionSource) * 100
    return percent
  }, [data])

  const subPosts = useMemo(() => {
    if (Object.keys(Post).includes(post)) {
      return subPostsByPost[post as Post]
    }
    return null
  }, [post])

  useEffect(() => {
    if (ref.current) {
      if (displayChildren) {
        const height = ref.current.scrollHeight
        ref.current.style.height = `${height}px`
      } else {
        ref.current.style.height = '0px'
      }
    }
  }, [displayChildren, ref])

  return (
    mainPost && (
      <StyledLink
        displayChildren={displayChildren}
        post={mainPost}
        data-testid="post-infography"
        onMouseEnter={() => (displayTimeout.current = setTimeout(() => setDisplayChildren(true), 300))}
        onMouseLeave={() => {
          if (displayTimeout.current) {
            clearTimeout(displayTimeout.current)
          }
          setDisplayChildren(false)
        }}
        href={`/etudes/${studyId}/comptabilisation/saisie-des-donnees/${mainPost}`}
      >
        <DynamicComponent
          environmentComponents={{
            [Environment.CUT]: (
              <CutPostHeader
                post={post}
                mainPost={mainPost}
                emissionValue={data?.value}
                percent={percent}
                color={postColor}
                resultsUnit={resultsUnit}
              />
            ),
          }}
          defaultComponent={
            <PostHeader
              post={post}
              mainPost={mainPost}
              emissionValue={data?.value}
              percent={percent}
              color={postColor}
              resultsUnit={resultsUnit}
            />
          }
        />
        <SubPostInfography subPosts={subPosts} ref={ref} />
      </StyledLink>
    )
  )
}

export default PostInfography
