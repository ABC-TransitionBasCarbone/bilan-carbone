import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { getStandardDeviationRating } from '@/services/uncertainty'
import { postColors } from '@/utils/study'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import PostIcon from '../../infography/icons/PostIcon'
import styles from './MostUncertainPostsChart.module.css'

interface Props {
  computedResults: ResultsByPost[]
}

const MostUncertainPostsChart = ({ computedResults }: Props) => {
  const t = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')

  const threeMostUncertainPosts = computedResults
    .sort((a, b) => {
      if (!a.uncertainty || !b.uncertainty) {
        return 0
      }
      return b.uncertainty - a.uncertainty
    })
    .slice(0, 3)
    .map((result) => ({
      icon: result.post as Post,
      post: t(result.post),
      color: postColors[result.post as Post],
      uncertainty: tQuality(getStandardDeviationRating(result.uncertainty ?? 1).toString()),
    }))

  const PostInfo = ({ post }: { post: { post: string; color: string; uncertainty: string; icon: Post } }) => (
    <div className={classNames(styles[post.color], styles.postContainer, 'grow justify-around align-center px-2')}>
      <PostIcon post={post.icon as Post} className={classNames(styles.icon, 'mr-4')} />
      <p>
        {post.post} : {post.uncertainty}
      </p>
    </div>
  )

  return (
    <div className={classNames(styles.container, 'flex-col grow')}>
      <PostInfo post={threeMostUncertainPosts[0]} />
      <div className="flex-row grow">
        <PostInfo post={threeMostUncertainPosts[1]} />
        <PostInfo post={threeMostUncertainPosts[2]} />
      </div>
    </div>
  )
}

export default MostUncertainPostsChart
