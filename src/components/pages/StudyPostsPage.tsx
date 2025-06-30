'use client'

import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { StudyRole } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import GlossaryModal from '../modals/GlossaryModal'
import SubPosts from '../study/SubPosts'
import StudyPostsBlock from '../study/buttons/StudyPostsBlock'
import StudyPostInfography from '../study/infography/StudyPostInfography'

interface Props {
  post: Post
  study: FullStudy
  userRole: StudyRole
  emissionSources: FullStudy['emissionSources']
  studySite: string
}

const StudyPostsPage = ({ post, study, userRole, emissionSources, studySite }: Props) => {
  const [showInfography, setShowInfography] = useState(false)
  const tPost = useTranslations('emissionFactors.post')
  const [glossary, setGlossary] = useState('')

  return (
    <>
      <StudyPostsBlock
        post={post}
        study={study}
        display={showInfography}
        setDisplay={setShowInfography}
        emissionSources={emissionSources}
        setGlossary={setGlossary}
      >
        {showInfography && <StudyPostInfography study={study} studySite={studySite} />}
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
      {glossary && (
        <GlossaryModal glossary={glossary} label="post-glossary" t={tPost} onClose={() => setGlossary('')}>
          {tPost(`glossaryDescription.${glossary}`)}
        </GlossaryModal>
      )}
    </>
  )
}

export default StudyPostsPage
