import { Post } from '@/services/posts'
import { FullStudy } from '@/db/study'
import { useTranslations } from 'next-intl'
import React from 'react'
import Block from '../base/Block'
import SubPosts from '../study/SubPosts'
import StudyPostInfography from '../study/infography/StudyPostInfography'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import PostIcon from '../study/infography/icons/PostIcon'

interface Props {
  post: Post
  study: FullStudy
}

const StudyPostsPage = ({ post, study }: Props) => {
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
      <Block title={tPost(post)} icon={<PostIcon post={post} />}>
        <StudyPostInfography study={study} />
        <SubPosts post={post} study={study} />
      </Block>
    </>
  )
}

export default StudyPostsPage
