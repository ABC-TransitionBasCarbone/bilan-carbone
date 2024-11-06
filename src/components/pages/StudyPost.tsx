import { Post } from '@/services/posts'
import { Study } from '@prisma/client'
import { useTranslations } from 'next-intl'
import React from 'react'
import Block from '../base/Block'
import SubPosts from '../study/SubPosts'
import StudyPostInfography from './StudyPostInfography'

interface Props {
  post: Post
  study: Study
}

const StudyPostPage = ({ post, study }: Props) => {
  const tPost = useTranslations('emissions.post')
  return (
    <>
      <Block title={study.name} as="h1" />
      <Block title={tPost(post)}>
        <StudyPostInfography study={study} />
        <SubPosts post={post} study={study} />
      </Block>
    </>
  )
}

export default StudyPostPage
