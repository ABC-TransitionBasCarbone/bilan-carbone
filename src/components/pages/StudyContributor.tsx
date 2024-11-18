import { Post, subPostsByPost } from '@/services/posts'
import { useTranslations } from 'next-intl'
import React from 'react'
import Block from '../base/Block'
import SubPosts from '../study/SubPosts'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import PostIcon from '../study/infography/icons/PostIcon'
import { User } from 'next-auth'
import { StudyWithoutDetail } from '@/services/permissions/study'

interface Props {
  study: StudyWithoutDetail
  user: User
}

const StudyContributorPage = ({ study, user }: Props) => {
  const tNav = useTranslations('nav')
  const tPost = useTranslations('emissionFactors.post')
  return (
    <>
      <Breadcrumbs current={study.name} links={[{ label: tNav('home'), link: '/' }]} />
      <Block title={study.name} as="h1" />
      {Object.values(Post)
        .filter((post) => {
          const subPosts = subPostsByPost[post]
          return study.emissionSources.some((emissionSource) => subPosts.includes(emissionSource.subPost))
        })
        .map((post) => (
          <Block key={post} title={tPost(post)} icon={<PostIcon post={post} />}>
            <SubPosts post={post} study={study} user={user} withoutDetail />
          </Block>
        ))}
    </>
  )
}

export default StudyContributorPage
