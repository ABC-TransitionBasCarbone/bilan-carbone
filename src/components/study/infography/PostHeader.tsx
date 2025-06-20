import { Post } from '@/services/posts'
import { SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import progressStyles from '../../base/ProgressBar.module.css'
import PostIcon from './icons/PostIcon'
import styles from './PostHeader.module.css'

interface Props {
  post: Post | SubPost
  mainPost: Post | null
  emissionValue: string
  percent: number
  color: string
}

export const PostHeader = ({ post, mainPost, emissionValue, percent, color }: Props) => {
  const t = useTranslations('emissionFactors.post')

  return (
    <div className={classNames(styles.header, 'align-center', 'flex-col')}>
      {percent > 0 && (
        <div
          className={classNames(styles.progress, styles[`progress-${color}`], progressStyles[`w${percent.toFixed(0)}`])}
        />
      )}
      <div className={styles.content}>
        <div className={classNames(styles.title, 'flex-cc')}>
          <span>{mainPost && <PostIcon className={styles.icon} post={mainPost} />}</span>
          <span>{t(post)}</span>
        </div>
        <span>{emissionValue}</span>
      </div>
    </div>
  )
}
