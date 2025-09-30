'use client'

import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { StudyRole } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import GlossaryModal from '../modals/GlossaryModal'
import SubPosts from '../study/SubPosts'
import StudyPostsBlock from '../study/buttons/StudyPostsBlock'
import StudyPostInfography from '../study/infography/StudyPostInfography'
import styles from './StudyPostsPage.module.css'

interface Props {
  post: Post
  study: FullStudy
  userRole: StudyRole
  emissionSources: FullStudy['emissionSources']
  studySite: string
  user: UserSession
}

const StudyPostsPage = ({ post, study, userRole, emissionSources, studySite, user }: Props) => {
  const [showInfography, setShowInfography] = useState(false)
  const tPost = useTranslations('emissionFactors.post')
  const [glossary, setGlossary] = useState('')

  const glossaryDescription = useMemo(() => {
    const textForGlossary = tPost.has(
      `glossaryDescription.${glossary}${study.organizationVersion.environment.toLowerCase()}`,
    )
      ? `glossaryDescription.${glossary}${study.organizationVersion.environment.toLowerCase()}`
      : `glossaryDescription.${glossary}`

    return tPost.rich(textForGlossary, {
      link: (children) => (
        <Link className={styles.link} href={tPost(`${textForGlossary}Link`)} target="_blank" rel="noreferrer noopener">
          {children}
        </Link>
      ),
    })
  }, [glossary, study.organizationVersion.environment, tPost])

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
      {glossary && (
        <GlossaryModal glossary={glossary} label="post-glossary" t={tPost} onClose={() => setGlossary('')}>
          {glossaryDescription}
        </GlossaryModal>
      )}
    </>
  )
}

export default StudyPostsPage
