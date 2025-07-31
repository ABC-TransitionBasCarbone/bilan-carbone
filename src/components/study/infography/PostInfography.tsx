'use client'

import { BasePostInfography } from '@/environments/base/study/infography/BasePostInfography'
import { Post, subPostsByPost } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { getEmissionValueString, getValidationPercentage } from '@/utils/study'
import { StudyResultUnit, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

interface Props {
  post: Post | SubPost
  data?: ResultsByPost
  studyId: string
  resultsUnit: StudyResultUnit
}

const PostInfography = ({ post, data, studyId, resultsUnit }: Props) => {
  const tUnits = useTranslations('study.results.units')

  const mainPost = useMemo(() => {
    if (Object.keys(Post).includes(post)) {
      return post as Post
    } else {
      const entry = Object.entries(subPostsByPost).find(([, subPosts]) => subPosts.includes(post as SubPost))
      return entry ? (entry[0] as Post) : null
    }
  }, [post])

  const subPosts = useMemo(() => {
    if (Object.keys(Post).includes(post)) {
      return subPostsByPost[post as Post]
    }
    return null
  }, [post])

  const emissionValue = useMemo(() => {
    const unit = tUnits(resultsUnit)
    return getEmissionValueString(data?.value, resultsUnit, unit)
  }, [data, resultsUnit, tUnits])

  const percent = useMemo(() => getValidationPercentage(data), [data])

  return (
    mainPost && (
      <BasePostInfography
        post={post}
        mainPost={mainPost}
        subPosts={subPosts}
        studyId={studyId}
        percent={percent}
        emissionValue={emissionValue}
      />
    )
  )
}

export default PostInfography
