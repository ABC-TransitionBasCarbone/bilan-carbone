'use client'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { getUserRoleOnStudy } from '@/utils/study'
import { StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import SubPosts from '../study/SubPosts'
import StudyPostsBlock from '../study/buttons/StudyPostsBlock'
import StudyPostInfography from '../study/infography/StudyPostInfography'
import useStudySite from '../study/site/useStudySite'
import StudyPostsCard from './StudyPostsCard'

interface Props {
  post: Post
  study: FullStudy
  user: User
}

const StudyPostsPage = ({ post, study, user }: Props) => {
  const [showInfography, setShowInfography] = useState(false)
  const tNav = useTranslations('nav')
  const tPost = useTranslations('emissionFactors.post')
  const userRole = getUserRoleOnStudy(user, study)
  const { studySite, setSite } = useStudySite(study)

  const emissionSources = useMemo(
    () =>
      study.emissionSources.filter(
        (emissionSource) =>
          subPostsByPost[post].includes(emissionSource.subPost) && emissionSource.studySite.id === studySite,
      ) as FullStudy['emissionSources'],
    [study, post, studySite],
  )

  return (
    <>
      <Breadcrumbs
        current={tPost(post)}
        links={[
          { label: tNav('home'), link: '/' },
          study.organization.isCR
            ? {
                label: study.organization.name,
                link: `/organisations/${study.organization.id}`,
              }
            : undefined,

          { label: study.name, link: `/etudes/${study.id}` },
        ].filter((link) => link !== undefined)}
      />
      <Block>
        <StudyPostsCard
          study={study}
          post={post}
          userRole={userRole as StudyRole}
          studySite={studySite}
          setSite={setSite}
        />
      </Block>
      <StudyPostsBlock
        post={post}
        study={study}
        display={showInfography}
        setDisplay={setShowInfography}
        emissionSources={emissionSources}
      >
        {showInfography && <StudyPostInfography study={study} studySite={studySite} />}
        <SubPosts
          post={post}
          study={study}
          user={user}
          withoutDetail={false}
          studySite={studySite}
          emissionSources={emissionSources}
        />
      </StudyPostsBlock>
    </>
  )
}

export default StudyPostsPage
