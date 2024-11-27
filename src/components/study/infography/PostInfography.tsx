'use client'

import { Post, subPostsByPost } from '@/services/posts'
import { ResultsByPost } from '@/services/results'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { SubPost } from '@prisma/client'
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
}

const colors: Record<string, { dark: string; light: string }> = {
  darkBlue: {
    dark: '#0c2155',
    light: '#3f5488',
  },
  green: {
    dark: '#469478',
    light: '#79c7ab',
  },
  blue: {
    dark: '#2c6498',
    light: '#5e97cb',
  },
  orange: {
    dark: '#c88938',
    light: '#fbbc6b',
  },
}

const postColors: Record<Post, string> = {
  Energies: 'darkBlue',
  AutresEmissionsNonEnergetiques: 'darkBlue',
  DechetsDirects: 'darkBlue',
  Immobilisations: 'darkBlue',
  IntrantsBienEtMatieres: 'blue',
  IntrantsServices: 'blue',
  Deplacements: 'green',
  Fret: 'green',
  FinDeVie: 'orange',
  UtilisationEtDependance: 'orange',
}

const PostInfography = ({ post, data, studyId }: Props) => {
  const ref = useRef<HTMLDivElement>(null)

  const [showSubPosts, setShowSubPosts] = useState<boolean>(false)
  const [hoverEnterTimeout, setHoverEnterTimeout] = useState<NodeJS.Timeout | null>(null)
  const [hoverLeaveTimeout, setHoverLeaveTimeout] = useState<NodeJS.Timeout | null>(null)

  const t = useTranslations('emissionFactors.post')

  const mainPost = useMemo(() => {
    if (Object.keys(Post).includes(post)) {
      return post as Post
    } else {
      const entry = Object.entries(subPostsByPost).find(([, subPosts]) => subPosts.includes(post as SubPost))
      return entry ? (entry[0] as Post) : null
    }
  }, [post])

  const dark = useMemo(() => {
    return mainPost ? colors[postColors[mainPost]].dark : colors.green.dark
  }, [mainPost])

  const light = useMemo(() => {
    return mainPost ? colors[postColors[mainPost]].light : colors.green.light
  }, [mainPost])

  const colorPercentage = useMemo(() => {
    if (!data) return { inf: 0, sup: 0 }

    const percent = (data?.numberOfValidatedEmissionSource / data?.numberOfEmissionSource) * 100

    return { inf: Math.max(percent - 2, 0), sup: Math.min(percent + 2, 100) }
  }, [data])

  const subPosts = useMemo(() => {
    if (Object.keys(Post).includes(post)) {
      return subPostsByPost[post as Post]
    }
    return null
  }, [post])

  useEffect(() => {
    if (ref.current) {
      if (showSubPosts) {
        const height = ref.current.scrollHeight
        ref.current.style.height = `${height}px`

        setTimeout(() => {
          if (ref.current) {
            ref.current.style.height = 'auto'
            ref.current.style.overflow = 'visible'
          }
        }, 300)
      } else {
        setTimeout(() => {
          if (ref.current) {
            ref.current.style.height = '0px'
            ref.current.style.overflow = 'hidden'
          }
        }, 300)
      }
    }
  }, [showSubPosts, ref])

  return (
    mainPost && (
      <Link
        onMouseEnter={() => {
          if (hoverLeaveTimeout) {
            clearTimeout(hoverLeaveTimeout)
            setHoverLeaveTimeout(null)
          }

          const timeout = setTimeout(() => {
            setShowSubPosts(true)
          }, 200)
          setHoverEnterTimeout(timeout)
        }}
        onMouseLeave={() => {
          if (hoverEnterTimeout) {
            clearTimeout(hoverEnterTimeout)
            setHoverEnterTimeout(null)
          }

          const timeout = setTimeout(() => {
            setShowSubPosts(false)
          }, 500)
          setHoverLeaveTimeout(timeout)
        }}
        data-testid="post-infography"
        href={`/etudes/${studyId}/comptabilisation/saisie-des-donnees/${mainPost}`}
        className={classNames(styles.link)}
        style={{
          borderColor: dark,
          background: `linear-gradient(to right, ${dark} 0%, ${dark} ${colorPercentage.inf}%, ${light} ${colorPercentage.sup}%, ${light} 100%)`,
        }}
      >
        <PostHeader post={post} mainPost={mainPost} emissionValue={data?.value} />
        <div className={classNames(styles.subPostsContainer)} ref={ref}>
          {showSubPosts && subPosts && (
            <div className={classNames(styles.subPosts, 'flex')}>
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
