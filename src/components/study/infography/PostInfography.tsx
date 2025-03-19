'use client'

import { Post, subPostsByPost } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { colors, postColors } from '@/utils/study'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { StudyResultUnit, SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PostHeader } from './PostHeader'
import styles from './PostInfography.module.css'

interface Props {
  post: Post | SubPost
  data?: ResultsByPost
  studyId: string
  resultsUnit: StudyResultUnit
}

const PostInfography = ({ post, data, studyId, resultsUnit }: Props) => {
  const t = useTranslations('emissionFactors.post')
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
      <Link
        data-testid="post-infography"
        onMouseEnter={() => (displayTimeout.current = setTimeout(() => setDisplayChildren(true), 300))}
        onMouseLeave={() => {
          if (displayTimeout.current) {
            clearTimeout(displayTimeout.current)
          }
          setDisplayChildren(false)
        }}
        href={`/etudes/${studyId}/comptabilisation/saisie-des-donnees/${mainPost}`}
        className={classNames(styles[postColor], styles.link, { [styles.displayChildren]: displayChildren })}
        style={{ backgroundColor: colors[postColor].light }}
      >
        <PostHeader
          post={post}
          mainPost={mainPost}
          emissionValue={data?.value}
          percent={percent}
          color={colors[postColor].dark}
          resultsUnit={resultsUnit}
        />
        <div className={styles.subPostsContainer} ref={ref}>
          {subPosts && (
            <div className={classNames(styles[postColor], styles.subPosts, 'flex')}>
              <ul className={classNames(styles.list, 'flex-col')}>
                {subPosts.map((subPost) => (
                  <li className="align-center" key={subPost}>
                    <KeyboardArrowRightIcon />
                    {t(subPost)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Link>
    )
  )
}

export default PostInfography
