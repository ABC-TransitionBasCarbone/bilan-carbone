'use client'

import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import SubPosts from '../study/SubPosts'
import StudyPostsBlock from '../study/buttons/StudyPostsBlock'
import StudyPostInfography from '../study/infography/StudyPostInfography'

interface Props {
  post: Post
  study: FullStudy
  user: User
}

const StudyPostsPage = ({ post, study, user }: Props) => {
  const [showInfography, setShowInfography] = useState(false)
  const tNav = useTranslations('nav')
  const tPost = useTranslations('emissionFactors.post')
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
      <StudyPostsBlock post={post} study={study} display={showInfography} setDisplay={setShowInfography}>
        {showInfography && <StudyPostInfography study={study} />}
        <SubPosts post={post} study={study} user={user} withoutDetail={false} />
      </StudyPostsBlock>
    </>
  )
}

export default StudyPostsPage
