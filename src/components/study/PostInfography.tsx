import { Post, subPostsByPost } from '@/services/posts'
import { Study, SubPost } from '@prisma/client'
import React, { useMemo } from 'react'
import styles from './PostInfography.module.css'
import { useTranslations } from 'next-intl'
import classNames from 'classnames'
import Link from 'next/link'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
interface Props {
  study: Study
  post: Post | SubPost
}

const colors: Record<Post, string> = {
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

const PostInfography = ({ study, post }: Props) => {
  const t = useTranslations('emissions.post')
  const subPosts = useMemo(() => {
    if (Object.keys(Post).includes(post)) {
      return subPostsByPost[post as Post]
    }
    return null
  }, [post])
  return (
    <Link
      href={`/etudes/${study.id}/`}
      className={styles[Object.keys(Post).includes(post) ? colors[post as Post] : 'green']}
    >
      <div className={classNames(styles.header)}>{t(post)}</div>
      {subPosts && (
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
    </Link>
  )
}

export default PostInfography
