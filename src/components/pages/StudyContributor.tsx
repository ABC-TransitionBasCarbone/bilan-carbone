'use client'

import { FullStudy } from '@/db/study'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import PostIcon from '../study/infography/icons/PostIcon'
import SelectStudySite from '../study/site/SelectStudySite'
import useStudySite from '../study/site/useStudySite'
import SubPosts from '../study/SubPosts'

interface Props {
  study: StudyWithoutDetail
  user: User
}

const StudyContributionPage = ({ study, user }: Props) => {
  const tNav = useTranslations('nav')
  const tPost = useTranslations('emissionFactors.post')
  const { site, setSite } = useStudySite(study)

  const emissionSources = useMemo(
    () =>
      study.emissionSources.filter((emissionSource) => emissionSource.site.id === site) as FullStudy['emissionSources'],
    [study, site],
  )

  return (
    <>
      <Breadcrumbs current={study.name} links={[{ label: tNav('home'), link: '/' }]} />
      <Block title={study.name} as="h1">
        <SelectStudySite study={study} site={site} setSite={setSite} />
      </Block>

      <Block />
      {Object.values(Post)
        .filter((post) => {
          const subPosts = subPostsByPost[post]
          return study.emissionSources.some((emissionSource) => subPosts.includes(emissionSource.subPost))
        })
        .map((post) => (
          <Block key={post} title={tPost(post)} icon={<PostIcon post={post} />} iconPosition="before">
            <SubPosts
              post={post}
              study={study}
              user={user}
              withoutDetail
              emissionSources={emissionSources}
              site={site}
            />
          </Block>
        ))}
    </>
  )
}

export default StudyContributionPage
