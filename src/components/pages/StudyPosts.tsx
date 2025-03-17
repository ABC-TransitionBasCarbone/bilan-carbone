'use client'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { StudyResultUnit, StudyRole } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import SubPosts from '../study/SubPosts'
import StudyPostsBlock from '../study/buttons/StudyPostsBlock'
import StudyPostsCard from '../study/card/StudyPostsCard'
import StudyPostInfography from '../study/infography/StudyPostInfography'
import useStudySite from '../study/site/useStudySite'

interface Props {
  post: Post
  study: FullStudy
  userRole: StudyRole
  unit: StudyResultUnit
}

const StudyPostsPage = ({ post, study, userRole, unit }: Props) => {
  const [showInfography, setShowInfography] = useState(false)
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
        unit={unit}
      >
        {showInfography && <StudyPostInfography study={study} studySite={studySite} />}
        <SubPosts
          post={post}
          study={study}
          userRole={userRole}
          withoutDetail={false}
          studySite={studySite}
          emissionSources={emissionSources}
        />
      </StudyPostsBlock>
    </>
  )
}

export default StudyPostsPage
