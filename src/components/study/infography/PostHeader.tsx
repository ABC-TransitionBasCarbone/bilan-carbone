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
  percent: number
  color: string
}

export const PostHeader = ({ post, mainPost, emissionValue, percent, color }: Props) => {
  const t = useTranslations('emissionFactors.post')

  return (
    <div className={classNames(styles.header, 'align-center', 'flex-col')}>
      {percent > 0 && <div className={styles.progress} style={{ width: `${percent}%`, backgroundColor: color }} />}
      <div className={styles.content}>
        <div className={classNames(styles.title, 'flex-cc')}>
          <span>{mainPost && <PostIcon className={styles.icon} post={mainPost} />}</span>
          <span>{t(post)}</span>
        </div>
        <span>{formatNumber((emissionValue || 0) / 1000)} tCO₂e</span>
      </div>
    </div>
  )
}
