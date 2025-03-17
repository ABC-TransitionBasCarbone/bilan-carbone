import { Post } from '@/services/posts'
import { formatNumber, STUDY_UNIT_VALUES } from '@/utils/number'
import { StudyResultUnit, SubPost } from '@prisma/client'
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
  unit: StudyResultUnit
}

export const PostHeader = ({ post, mainPost, emissionValue, percent, color, unit }: Props) => {
  const t = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('settings.studyResultUnit')

  return (
    <div className={classNames(styles.header, 'align-center', 'flex-col')}>
      {percent > 0 && <div className={styles.progress} style={{ width: `${percent}%`, backgroundColor: color }} />}
      <div className={styles.content}>
        <div className={classNames(styles.title, 'flex-cc')}>
          <span>{mainPost && <PostIcon className={styles.icon} post={mainPost} />}</span>
          <span>{t(post)}</span>
        </div>
        <span>
          {formatNumber((emissionValue || 0) / STUDY_UNIT_VALUES[unit])} {tUnits(unit)}
        </span>
      </div>
    </div>
  )
}
