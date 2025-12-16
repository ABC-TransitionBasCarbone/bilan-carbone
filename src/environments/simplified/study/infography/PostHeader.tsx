import PostIcon from '@/components/study/infography/icons/PostIcon'
import { Post } from '@/services/posts'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
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
        <PostIcon post={mainPost} />
      </StyledIconColumn>
      <StyledContentColumn>
        <StyledTitle>{t(post)}</StyledTitle>
        <StyledEmissionValue>{emissionValue}</StyledEmissionValue>
        <div className="mt-2 w100">
          <SimplifiedProgressBar value={percent} />
        </div>
      </StyledContentColumn>
    </StyledPostHeader>
  )
}
