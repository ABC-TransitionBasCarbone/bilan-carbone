'use client'

import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { StudyRole } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useState } from 'react'
import SubPosts from '../study/SubPosts'
import StudyPostsBlock from '../study/buttons/StudyPostsBlock'
import StudyPostInfography from '../study/infography/StudyPostInfography'

interface Props {
  post: Post
  study: FullStudy
  userRole: StudyRole
  emissionSources: FullStudy['emissionSources']
  studySite: string
  user: UserSession
  setGlossary: (glossary: string) => void
}

const StudyPostsPage = ({ post, study, userRole, emissionSources, studySite, user, setGlossary }: Props) => {
  const [showInfography, setShowInfography] = useState(false)

  return (
    <>
      <StudyPostsBlock
        post={post}
        study={study}
        display={showInfography}
        setDisplay={setShowInfography}
        emissionSources={emissionSources}
      >
        {showInfography && <StudyPostInfography study={study} studySite={studySite} user={user} />}
        <SubPosts
          post={post}
          study={study}
          userRole={userRole}
          withoutDetail={false}
          studySite={studySite}
          emissionSources={emissionSources}
          setGlossary={setGlossary}
        />
      </StudyPostsBlock>
    </>
  )
}

export default StudyPostsPage
