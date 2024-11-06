import StudyPostPage from '@/components/pages/StudyPost'
import NotFound from '@/components/study/NotFound'
import { getStudyWithRightsById } from '@/db/study'
import { auth } from '@/services/auth'
import { canReadStudy } from '@/services/permissions/study'
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
  if (!id || !session) {
    return <NotFound />
  }

  const study = await getStudyWithRightsById(id)

  if (!study) {
    return <NotFound />
  }

  if (!(await canReadStudy(session.user, study))) {
    return <NotFound />
  }

  return <StudyPostPage post={post as Post} study={study} />
}

export default StudyPost
