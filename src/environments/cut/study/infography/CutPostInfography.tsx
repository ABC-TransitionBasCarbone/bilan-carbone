'use client'

import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { isPostValidated } from '@/utils/study'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import CheckCircleOutlineSharp from '@mui/icons-material/CheckCircleOutlineSharp'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  StyledContainer,
  StyledIconWrapper,
  StyledLink,
  StyledSubPostContainer,
  StyledSubPostItem,
} from './CutPostInfography.styles'
import { CutPostHeader } from './PostHeader'

interface Props {
  post: Post | SubPost
  data?: ResultsByPost
  mainPost: Post
  subPosts: SubPost[] | null
  studyId: string
  percent: number
  emissionValue: string
}

export const CutPostInfography = ({ post, mainPost, subPosts, data, studyId, percent, emissionValue }: Props) => {
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
        <CutPostHeader post={post} mainPost={mainPost} emissionValue={emissionValue} percent={percent} />
      </StyledLink>

      {subPosts && subPosts.length > 0 && (
        <StyledSubPostContainer isVisible={displayChildren}>
          <div className="flex-col gap-1">
            {subPosts.map((subPost) => {
              const subPostData = data?.subPosts.find((sp) => sp.post === subPost)
              const isValidated = isPostValidated(subPostData)
              return (
                <StyledSubPostItem
                  key={subPost}
                  className="flex align-center"
                  href={`/etudes/${studyId}/comptabilisation/saisie-des-donnees/${mainPost}`}
                  validated={isValidated}
                >
                  <StyledIconWrapper className="flex-cc">
                    {isValidated ? <CheckCircleOutlineSharp /> : <CancelOutlinedIcon />}
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
