import { PostHeader } from '@/components/study/infography/PostHeader'
import { SubPostInfography } from '@/components/study/infography/SubPostInfography'
import { Post } from '@/services/posts'
import { defaultPostColor, postColors } from '@/utils/study'
import { styled } from '@mui/material/styles'
import { SubPost } from '@prisma/client'
import { useEffect, useMemo, useRef, useState } from 'react'

const StyledLink = styled('div', { shouldForwardProp: (prop) => prop !== 'visible' && prop !== 'post' })<{
  post: Post
  visible: boolean
}>(({ theme, post, visible }) => ({
  borderRadius: '1rem',
  border: 'solid 0.25rem',
  backgroundColor: theme.custom.postColors[post]?.light,
  borderColor: theme.custom.postColors[post]?.dark,

  '&:hover': {
    '.list': {
      color: 'var(--primary-800)',
    },
  },

  '.subPostContainer': {
    minHeight: visible ? '0' : 'auto',
    height: visible ? 'auto' : '0',
  },
}))

interface Props {
  post: Post | SubPost
  mainPost: Post
  subPosts: SubPost[] | null
  studyId: string
  percent: number
  emissionValue: string
}

export const BasePostInfography = ({ post, mainPost, subPosts, studyId, percent, emissionValue }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const [displayChildren, setDisplayChildren] = useState(false)
  const displayTimeout = useRef<NodeJS.Timeout | null>(null)
  const postColor = useMemo(() => (mainPost ? postColors[mainPost] : defaultPostColor), [mainPost])

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
    <StyledLink
      visible={displayChildren}
      post={mainPost}
      data-testid="post-infography"
      onMouseEnter={() => (displayTimeout.current = setTimeout(() => setDisplayChildren(true), 300))}
      onMouseLeave={() => {
        if (displayTimeout.current) {
          clearTimeout(displayTimeout.current)
        }
        setDisplayChildren(false)
      }}
    >
      <PostHeader
        post={post}
        mainPost={mainPost}
        emissionValue={emissionValue}
        percent={percent}
        color={postColor}
        studyId={studyId}
      />
      <SubPostInfography subPosts={subPosts} ref={ref} studyId={studyId} mainPost={mainPost} />
    </StyledLink>
  )
}
