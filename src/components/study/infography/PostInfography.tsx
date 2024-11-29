import { Post, subPostsByPost } from '@/services/posts'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Study, SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo } from 'react'
import PostIcon from './icons/PostIcon'
import styles from './PostInfography.module.css'
interface Props {
  study: Study
  post: Post | SubPost
  hideSubPosts?: boolean
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

const PostInfography = ({ study, post, hideSubPosts }: Props) => {
  const t = useTranslations('emissionFactors.post')
  const mainPost = useMemo(() => {
    if (Object.keys(Post).includes(post)) {
      return post as Post
    } else {
      const entry = Object.entries(subPostsByPost).find(([, subPosts]) => subPosts.includes(post as SubPost))
      return entry ? (entry[0] as Post) : null
    }
  }, [post])

  const subPosts = useMemo(() => {
    if (Object.keys(Post).includes(post)) {
      return subPostsByPost[post as Post]
    }
    return null
  }, [post])

  return (
    <Link
      data-testid="post-infography"
      href={`/etudes/${study.id}/comptabilisation/saisie-des-donnees/${mainPost}`}
      className={styles[Object.keys(Post).includes(post) ? colors[post as Post] : 'green']}
    >
      <p className={classNames(styles.header, 'align-center')}>
        <span>{mainPost && <PostIcon className={styles.icon} post={mainPost} />}</span>
        <span>{t(post)}</span>
      </p>
      {!hideSubPosts && subPosts && (
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
