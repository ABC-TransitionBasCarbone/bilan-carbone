'use client'

import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { QuestionStats } from '@/services/serverFunctions/question'
import CheckCircleOutlineSharp from '@mui/icons-material/CheckCircleOutlineSharp'
import EditIcon from '@mui/icons-material/Edit'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { SimplifiedPostHeader } from './PostHeader'
import {
  StyledContainer,
  StyledIconWrapper,
  StyledLink,
  StyledSubPostContainer,
  StyledSubPostItem,
} from './SimplifiedPostInfography.styles'

interface Props {
  post: Post | SubPost
  data?: ResultsByPost
  mainPost: Post
  subPosts: SubPost[] | null
  studyId: string
  percent: number
  emissionValue: string
  questionStats: Partial<Record<SubPost, QuestionStats>>
}

export const SimplifiedPostInfography = ({
  post,
  mainPost,
  subPosts,
  studyId,
  percent,
  emissionValue,
  questionStats,
}: Props) => {
  const t = useTranslations('emissionFactors.post')
  const [displayChildren, setDisplayChildren] = useState(false)

  if (!mainPost) {
    return null
  }

  return (
    <StyledContainer
      className="flex-col p-2"
      onMouseEnter={() => setDisplayChildren(true)}
      onMouseLeave={() => {
        setDisplayChildren(false)
      }}
    >
      <StyledLink className="block" href={`/etudes/${studyId}/comptabilisation/saisie-des-donnees/${mainPost}`}>
        <SimplifiedPostHeader post={post} mainPost={mainPost} emissionValue={emissionValue} percent={percent} />
      </StyledLink>

      {subPosts && subPosts.length > 0 && (
        <StyledSubPostContainer isVisible={displayChildren}>
          <div className="flex-col gap-1">
            {subPosts.map((subPost) => {
              const subPostData = questionStats[subPost]
              const isValidated = subPostData?.total === subPostData?.answered
              return (
                <StyledSubPostItem
                  key={subPost}
                  className="flex align-center"
                  href={`/etudes/${studyId}/comptabilisation/saisie-des-donnees/${mainPost}?subPost=${subPost}`}
                  validated={isValidated}
                >
                  <StyledIconWrapper className="flex-cc">
                    {isValidated ? <CheckCircleOutlineSharp /> : <EditIcon />}
                  </StyledIconWrapper>
                  {t(subPost)}
                </StyledSubPostItem>
              )
            })}
          </div>
        </StyledSubPostContainer>
      )}
    </StyledContainer>
  )
}
