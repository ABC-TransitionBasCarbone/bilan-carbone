import { Post } from '@/services/posts'
import { Study } from '@prisma/client'
import { useTranslations } from 'next-intl'
import React from 'react'
import Block from '../base/Block'
import SubPosts from '../study/SubPosts'

interface Props {
  post: Post
  study: Study
}

const StudyPostPage = ({ post, study }: Props) => {
  const t = useTranslations('emissions.post')
  return (
    <>
      <Block title={study.name} as="h1" />
      <Block title={t(post)}>
        <SubPosts post={post} study={study} />
      </Block>
    </>
  )
}

export default StudyPostPage
