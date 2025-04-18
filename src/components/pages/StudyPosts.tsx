'use client'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { StudyRole } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import Block from '../base/Block'
import GlossaryModal from '../modals/GlossaryModal'
import SubPosts from '../study/SubPosts'
import StudyPostsBlock from '../study/buttons/StudyPostsBlock'
import StudyPostsCard from '../study/card/StudyPostsCard'
import StudyPostInfography from '../study/infography/StudyPostInfography'
import useStudySite from '../study/site/useStudySite'

interface Props {
  post: Post
  study: FullStudy
  userRole: StudyRole
}

const StudyPostsPage = ({ post, study, userRole }: Props) => {
  const [showInfography, setShowInfography] = useState(false)
  const tPost = useTranslations('emissionFactors.post')
  const { studySite, setSite } = useStudySite(study)
  const [glossary, setGlossary] = useState('')

  const emissionSources = useMemo(
    () =>
      study.emissionSources.filter(
        (emissionSource) =>
          subPostsByPost[post].includes(emissionSource.subPost) && emissionSource.studySite.id === studySite,
      ) as FullStudy['emissionSources'],
    [study, post, studySite],
  )

  return (
    <>
      <Block>
        <StudyPostsCard
          study={study}
          post={post}
          userRole={userRole as StudyRole}
          studySite={studySite}
          setSite={setSite}
        />
      </Block>
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
