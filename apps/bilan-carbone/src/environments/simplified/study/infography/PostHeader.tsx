import PostIcon from '@/components/study/infography/icons/PostIcon'
import { Post } from '@/services/posts'
import { SubPost } from '@abc-transitionbascarbone/db-common/enums'
import { useTranslations } from 'next-intl'
import styles from './PostHeader.module.css'
import {
  StyledContentColumn,
  StyledEmissionValue,
  StyledIconColumn,
  StyledPostHeader,
  StyledTitle,
} from './PostHeader.styles'
import { SimplifiedProgressBar } from './SimplifiedProgressBar'

interface Props {
  post: Post | SubPost
  mainPost: Post | null
  emissionValue: string
  percent: number
}

export const SimplifiedPostHeader = ({ post, mainPost, emissionValue, percent }: Props) => {
  const t = useTranslations('emissionFactors.post')

  if (!mainPost) {
    return null
  }

  return (
    <StyledPostHeader post={mainPost}>
      <StyledIconColumn>
        <PostIcon className={styles.postIcon} post={mainPost} />
      </StyledIconColumn>
      <StyledContentColumn>
        <StyledTitle post={post as Post}>{t(post)}</StyledTitle>
        <StyledEmissionValue>{emissionValue}</StyledEmissionValue>
        <div className="mt-2 w100">
          <SimplifiedProgressBar value={percent} />
        </div>
      </StyledContentColumn>
    </StyledPostHeader>
  )
}
