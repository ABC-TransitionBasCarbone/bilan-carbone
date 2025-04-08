import Block from '@/components/base/Block'
import Tabs from '@/components/base/Tabs'
import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { StudyRole } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import SubPostStepper from '../study/SubPostStepper'

interface Props {
  post: Post
  study: FullStudy
  userRole: StudyRole
}

const StudyPostsPage = ({ post, study, userRole }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const subPosts = useMemo(() => subPostsByPost[post], [post])
  const { studySite } = useStudySite(study)

  const emissionSources = useMemo(
    () =>
      study.emissionSources.filter(
        (emissionSource) => emissionSource.studySite.id === studySite,
      ) as FullStudy['emissionSources'],
    [study, studySite],
  )

  const tabContent = useMemo(() => {
    return subPosts.map((subPost) => (
      <SubPostStepper
        key={subPost}
        subPost={subPost}
        emissionSources={emissionSources.filter((emissionSource) => emissionSource.subPost === subPost)}
        study={study}
      />
    ))
  }, [subPosts, emissionSources, study])

  return (
    <Block title={tPost(post)} as="h1">
      <Tabs tabs={subPosts} t={tPost} content={tabContent} />
    </Block>
  )
}

export default StudyPostsPage
