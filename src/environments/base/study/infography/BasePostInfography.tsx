import { PostHeader } from '@/components/study/infography/PostHeader'
import { SubPostInfography } from '@/components/study/infography/SubPostInfography'
import { Post } from '@/services/posts'
import { defaultPostColor, postColors } from '@/utils/study'
import { styled } from '@mui/material/styles'
import { SubPost } from '@prisma/client'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

const StyledLink = styled(Link, { shouldForwardProp: (prop) => prop !== 'visible' && prop !== 'post' })<{
  post: Post
  visible: boolean
}>(({ theme, post, visible }) => ({
  borderRadius: '1rem',
  border: 'solid 0.25rem',
  textDecoration: 'none',
  outlineOffset: '0.375rem',

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

  const href = useMemo(() => {
    const isSubPost = Object.values(SubPost).includes(post as SubPost)
    if (isSubPost) {
      return `/etudes/${studyId}/comptabilisation/saisie-des-donnees/${mainPost}#subpost-${post}`
    }
    return `/etudes/${studyId}/comptabilisation/saisie-des-donnees/${mainPost}`
  }, [post, mainPost, studyId])

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
      href={href}
    >
      <PostHeader post={post} mainPost={mainPost} emissionValue={emissionValue} percent={percent} color={postColor} />
      <SubPostInfography subPosts={subPosts} ref={ref} studyId={studyId} mainPost={mainPost} />
    </StyledLink>
  )
}
