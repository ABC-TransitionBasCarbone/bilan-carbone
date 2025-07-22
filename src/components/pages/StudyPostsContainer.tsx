'use client'
import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import StudyPostsPageCut from '@/environments/cut/pages/StudyPostsPage'
import { Post, subPostsByPost } from '@/services/posts'
import { Environment, StudyRole } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyPostsCard from '../study/card/StudyPostsCard'
import useStudySite from '../study/site/useStudySite'
import StudyPostsPage from './StudyPostsPage'

interface Props {
  post: Post
  study: FullStudy
  userRole: StudyRole
}

const StudyPostsPageContainer = ({ post, study, userRole }: Props) => {
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
          />
        }
        environmentComponents={{
          [Environment.CUT]: <StudyPostsPageCut post={post} study={study} studySiteId={studySite} />,
        }}
      />
    </>
  )
}

export default StudyPostsPageContainer
