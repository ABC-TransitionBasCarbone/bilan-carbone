import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { getQualitativeUncertaintyFromSquaredStandardDeviation } from '@/services/uncertainty'
import { postColors } from '@/utils/study'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import PostIcon from '../../infography/icons/PostIcon'
import styles from './MostUncertainPostsChart.module.css'
import commonStyles from './UncertaintyAnalytics.module.css'

interface Props {
  computedResults: ResultsByPost[]
}

const MostUncertainPostsChart = ({ computedResults }: Props) => {
  const t = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')
  const tUncertainties = useTranslations('study.results.uncertainties')

  const threeMostUncertainPosts = [...computedResults]
    .filter((post) => post.post !== 'total')
    .sort((a, b) => {
      if (!a.squaredStandardDeviation || !b.squaredStandardDeviation) {
        if (!a.squaredStandardDeviation && b.squaredStandardDeviation) {
          return 1
        }
        if (a.squaredStandardDeviation && !b.squaredStandardDeviation) {
          return -1
        }
        return 0
      }
      return b.squaredStandardDeviation - a.squaredStandardDeviation
    })
    .slice(0, 3)
    .map((result) => ({
      icon: result.post as Post,
      post: t(result.post),
      color: postColors[result.post as Post],
      squaredStandardDeviation: tQuality(
        getQualitativeUncertaintyFromSquaredStandardDeviation(result.squaredStandardDeviation ?? 1).toString(),
      ),
    }))

  const PostInfo = ({
    post,
  }: {
    post: { post: string; color: string; squaredStandardDeviation: string; icon: Post }
  }) => (
    <div className={classNames(styles[post.color], styles.postContainer, 'grow justify-center align-center p-2')}>
      <PostIcon post={post.icon as Post} className={classNames(styles.icon, 'mr1')} />
      <p>
        {post.post} : {post.squaredStandardDeviation}
      </p>
    </div>
  )

  return (
    <div className={classNames(styles.container, 'grow flex-col h100')}>
      <div className="grow align-center">
        <div>
          <PostInfo post={threeMostUncertainPosts[0]} />
          <div className="flex-row grow">
            <PostInfo post={threeMostUncertainPosts[1]} />
            <PostInfo post={threeMostUncertainPosts[2]} />
          </div>
        </div>
      </div>
      <div className="flex-cc mt1">
        <div className={classNames(commonStyles.title, 'grow')}>
          <p className="bold">{tUncertainties('uncertainPostsTitle')}</p>
        </div>
      </div>
    </div>
  )
}

export default MostUncertainPostsChart
