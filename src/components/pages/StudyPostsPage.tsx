'use client'

import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { getEmissionSourcesFuseOptions } from '@/utils/emissionSources'
import { StudyRole } from '@prisma/client'
import Fuse from 'fuse.js'
import { UserSession } from 'next-auth'
import { useLocale, useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
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
  const [filter, setFilter] = useState('')
  const tQuality = useTranslations('quality')
  const tUnit = useTranslations('units')
  const locale = useLocale()

  const fuseOptions = useMemo(() => getEmissionSourcesFuseOptions(tQuality, tUnit, locale), [locale, tQuality, tUnit])

  const fuse = useMemo(() => new Fuse(emissionSources, fuseOptions), [emissionSources, fuseOptions])

  const filteredSources = useMemo(
    () => (filter ? fuse.search(filter).map(({ item }) => item) : emissionSources),
    [emissionSources, filter, fuse],
  )

  return (
    <>
      <StudyPostsBlock
        post={post}
        study={study}
        display={showInfography}
        setDisplay={setShowInfography}
        emissionSources={emissionSources}
        filter={filter}
        setFilter={setFilter}
      >
        {showInfography && <StudyPostInfography study={study} studySite={studySite} user={user} />}
        <SubPosts
          post={post}
          study={study}
          userRole={userRole}
          withoutDetail={false}
          studySite={studySite}
          emissionSources={filteredSources}
          setGlossary={setGlossary}
        />
      </StudyPostsBlock>
    </>
  )
}

export default StudyPostsPage
