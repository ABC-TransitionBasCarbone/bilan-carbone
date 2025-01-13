import { Post } from '@/services/posts'
import { formatNumber } from '@/utils/number'
import { SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './PostHeader.module.css'
import PostIcon from './icons/PostIcon'

interface Props {
  post: Post | SubPost
  mainPost: Post | null
  emissionValue?: number
}

export const PostHeader = ({ post, mainPost, emissionValue }: Props) => {
  const t = useTranslations('emissionFactors.post')

  return (
    <div className={classNames(styles.header, 'align-center', 'flex-col')}>
      <div className={classNames(styles.title, 'flex-cc')}>
        <span>{mainPost && <PostIcon className={styles.icon} post={mainPost} />}</span>
        <span>{t(post)}</span>
      </div>
      <span>{formatNumber(emissionValue || 0)} kgCO2e</span>
    </div>
  )
}
