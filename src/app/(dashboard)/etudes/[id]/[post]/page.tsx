import StudyPostsPage from '@/components/pages/StudyPosts'
import NotFound from '@/components/pages/NotFound'
import { getStudyById } from '@/db/study'
import { auth } from '@/services/auth'
import { canReadStudyDetail } from '@/services/permissions/study'
import { Post } from '@/services/posts'
import React from 'react'

interface Props {
  params: {
    id: string
    post: string
  }
}

const StudyPost = async ({ params }: Props) => {
  const session = await auth()

  const post = Object.keys(Post).find((key) => key === params.post)
  if (!post) {
    return <NotFound />
  }

  const id = params.id
  if (!id || !session || !session.user) {
    return <NotFound />
  }

  const study = await getStudyById(id)

  if (!study) {
    return <NotFound />
  }

  if (!(await canReadStudyDetail(session.user, study))) {
    return <NotFound />
  }

  return <StudyPostsPage post={post as Post} study={study} user={session.user} />
}

export default StudyPost
