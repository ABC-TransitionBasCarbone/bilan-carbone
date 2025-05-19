'use client'
import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import StudyPostsPageCut from '@/environments/cut/pages/StudyPosts'
import { Post } from '@/services/posts'
import { CUT } from '@/store/AppEnvironment'
import { StudyRole } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyPostsPage from './StudyPosts'

interface Props {
  post: Post
  study: FullStudy
  userRole: StudyRole
}

const StudyPostsPageContainer = ({ post, study, userRole }: Props) => {
  const tNav = useTranslations('nav')
  const tPost = useTranslations('emissionFactors.post')

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
      <DynamicComponent
        defaultComponent={<StudyPostsPage post={post} study={study} userRole={userRole} />}
        environmentComponents={{ [CUT]: <StudyPostsPageCut post={post} study={study} /> }}
      />
    </>
  )
}

export default StudyPostsPageContainer
