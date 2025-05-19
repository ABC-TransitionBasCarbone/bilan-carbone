// TO DELETE ts-nockeck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import withAuth, { UserProps } from '@/components/hoc/withAuth'
import withStudy, { StudyProps } from '@/components/hoc/withStudy'
import NotFound from '@/components/pages/NotFound'
import StudyPostsPageContainer from '@/components/pages/StudyPostsContainer'
import { canReadStudyDetail } from '@/services/permissions/study'
import { Post } from '@/services/posts'
import { getUserRoleOnStudy } from '@/utils/study'

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

  const userRole = getUserRoleOnStudy(props.user, props.study)
  if (!userRole) {
    return <NotFound />
  }

  return <StudyPostsPageContainer post={post as Post} study={props.study} userRole={userRole} />
}

export default withAuth(withStudy(StudyPost))
