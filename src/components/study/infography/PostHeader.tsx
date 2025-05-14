import { Post } from '@/services/posts'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { StudyResultUnit, SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import progressStyles from '../../base/ProgressBar.module.css'
import PostIcon from './icons/PostIcon'
import styles from './PostHeader.module.css'

interface Props {
  post: Post | SubPost
  mainPost: Post | null
  emissionValue?: number
  percent: number
  color: string
  resultsUnit: StudyResultUnit
}

export const PostHeader = ({ post, mainPost, emissionValue, percent, color, resultsUnit }: Props) => {
  const t = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')

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
        <span>
          {formatNumber((emissionValue || 0) / STUDY_UNIT_VALUES[resultsUnit])} {tUnits(resultsUnit)}
        </span>
      </div>
    </div>
  )
}
