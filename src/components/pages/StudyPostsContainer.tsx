'use client'
import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import StudyPostsPageCut from '@/environments/cut/pages/StudyPostsPage'
import { Post, subPostsByPost } from '@/services/posts'
import { Environment, StudyRole, SubPost } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyPostsCard from '../study/card/StudyPostsCard'
import useStudySite from '../study/site/useStudySite'
import StudyPostsPage from './StudyPostsPage'

interface Props {
  post: Post
  currentSubPost: SubPost | undefined
  study: FullStudy
  userRole: StudyRole
  user: UserSession
}

const StudyPostsPageContainer = ({ post, currentSubPost, study, userRole, user }: Props) => {
  const tNav = useTranslations('nav')
  const tPost = useTranslations('emissionFactors.post')
  const { studySite, setSite } = useStudySite(study)

  const emissionSources = useMemo(
    () =>
      study.emissionSources.filter(
        (emissionSource) =>
          subPostsByPost[post].includes(emissionSource.subPost) && emissionSource.studySite.id === studySite,
      ) as FullStudy['emissionSources'],
    [study, post, studySite],
  )

  const isCut = useMemo(
    () => study.organizationVersion.environment === Environment.CUT,
    [study.organizationVersion.environment],
  )

  return (
    <>
      <Breadcrumbs
        current={tPost(post)}
        links={[
          { label: tNav('home'), link: '/' },
          study.organizationVersion.isCR
            ? {
                label: study.organizationVersion.organization.name,
                link: `/organisations/${study.organizationVersion.id}`,
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
          isCut={isCut}
        />
      </Block>
      <DynamicComponent
        defaultComponent={
          <StudyPostsPage
            post={post}
            study={study}
            userRole={userRole}
            emissionSources={emissionSources}
            studySite={studySite}
            user={user}
          />
        }
        environmentComponents={{
          [Environment.CUT]: (
            <StudyPostsPageCut currentSubPost={currentSubPost} post={post} study={study} studySiteId={studySite} />
          ),
        }}
      />
    </>
  )
}

export default StudyPostsPageContainer
