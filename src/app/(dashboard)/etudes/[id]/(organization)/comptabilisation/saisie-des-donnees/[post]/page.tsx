import withAuth, { UserProps } from '@/components/hoc/withAuth'
import withStudy, { StudyProps } from '@/components/hoc/withStudy'
import NotFound from '@/components/pages/NotFound'
import StudyPostsPage from '@/components/pages/StudyPosts'
import { canReadStudyDetail } from '@/services/permissions/study'
import { Post } from '@/services/posts'

interface Props {
  params: Promise<{
    post: string
  }>
}

const StudyPost = async (props: Props & StudyProps & UserProps) => {
  const params = await props.params

  const post = Object.keys(Post).find((key) => key === params.post)
  if (!post) {
    return <NotFound />
  }

  if (!(await canReadStudyDetail(props.user, props.study))) {
    return <NotFound />
  }

  return <StudyPostsPage post={post as Post} study={props.study} user={props.user} />
}

export default withAuth(withStudy(StudyPost))
