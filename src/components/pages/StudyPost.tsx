import { Post } from '@/services/posts'
import { Study } from '@prisma/client'
import { useTranslations } from 'next-intl'
import React from 'react'
import Block from '../base/Block'
import SubPosts from '../study/SubPosts'
import StudyPostInfography from '../study/StudyPostInfography'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

interface Props {
  post: Post
  study: Study
}

const StudyPostPage = ({ post, study }: Props) => {
  const tNav = useTranslations('nav')
  const tPost = useTranslations('emissions.post')
  return (
    <>
      <Breadcrumbs
        current={tPost(post)}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
        ]}
      />
      <Block title={study.name} as="h1" />
      <Block title={tPost(post)}>
        <StudyPostInfography study={study} />
        <SubPosts post={post} study={study} />
      </Block>
    </>
  )
}

export default StudyPostPage
