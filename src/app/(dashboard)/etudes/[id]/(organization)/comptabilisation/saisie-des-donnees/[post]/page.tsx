import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudy, { StudyProps } from '@/components/hoc/withStudy'
import NotFound from '@/components/pages/NotFound'
import StudyPostsPageContainer from '@/components/pages/StudyPostsContainer'
import { canReadStudyDetail } from '@/services/permissions/study'
import { Post } from '@/services/posts'
import { getAccountRoleOnStudy } from '@/utils/study'
import { SubPost } from '@prisma/client'

interface Props {
  params: Promise<{
    post: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const StudyPost = async (props: Props & StudyProps & UserSessionProps) => {
  const params = await props.params
  const searchParams = await props.searchParams

  const post = Object.keys(Post).find((key) => key === params.post)
  if (!post) {
    return <NotFound />
  }

  if (!(await canReadStudyDetail(props.user, props.study))) {
    return <NotFound />
  }

  const userRole = getAccountRoleOnStudy(props.user, props.study)
  if (!userRole) {
    return <NotFound />
  }

  const subPostParam = searchParams['subPost']
  const currentSubPost =
    typeof subPostParam === 'string' && Object.values(SubPost).includes(subPostParam as SubPost)
      ? (subPostParam as SubPost)
      : undefined

  return (
    <StudyPostsPageContainer
      post={post as Post}
      study={props.study}
      userRole={userRole}
      user={props.user}
      currentSubPost={currentSubPost}
    />
  )
}

export default withAuth(withStudy(StudyPost))
