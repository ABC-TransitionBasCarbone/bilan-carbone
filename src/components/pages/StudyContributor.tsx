import { StudyWithoutDetail } from '@/services/permissions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import PostIcon from '../study/infography/icons/PostIcon'
import SubPosts from '../study/SubPosts'

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
          <Block key={post} title={tPost(post)} icon={<PostIcon post={post} />} iconPosition="before">
            <SubPosts post={post} study={study} user={user} withoutDetail />
          </Block>
        ))}
    </>
  )
}

export default StudyContributorPage
