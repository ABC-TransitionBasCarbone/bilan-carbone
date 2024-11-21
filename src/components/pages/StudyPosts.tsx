import { Post } from '@/services/posts'
import { FullStudy } from '@/db/study'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import SubPosts from '../study/SubPosts'
import StudyPostInfography from '../study/infography/StudyPostInfography'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import PostIcon from '../study/infography/icons/PostIcon'
import { User } from 'next-auth'

interface Props {
  post: Post
  study: FullStudy
  user: User
}

const StudyPostsPage = ({ post, study, user }: Props) => {
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
      <Block title={tPost(post)} icon={<PostIcon post={post} />} iconPosition="before">
        <StudyPostInfography study={study} />
        <SubPosts post={post} study={study} user={user} withoutDetail={false} />
      </Block>
    </>
  )
}

export default StudyPostsPage
