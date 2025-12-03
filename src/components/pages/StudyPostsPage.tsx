'use client'

import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { EmissionSourcesStatus } from '@/services/study'
import { EmissionSourcesFilters } from '@/types/filters'
import { getEmissionSourcesFuseOptions } from '@/utils/emissionSources'
import { EmissionSourceCaracterisation, EmissionSourceType, StudyRole } from '@prisma/client'
import Fuse from 'fuse.js'
import { UserSession } from 'next-auth'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
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
  const tQuality = useTranslations('quality')
  const tUnit = useTranslations('units')
  const locale = useLocale()

  const [emissionSourcesFilters, setEmissionSourcesFilters] = useState<EmissionSourcesFilters>({
    search: '',
    subPosts: Object.values(subPostsByPost[post]),
    tags: study.tagFamilies.reduce(
      (res, tagFamily) => [...res, ...tagFamily.tags.map((tag) => tag.id)],
      [] as string[],
    ),
    activityData: Object.values(EmissionSourceType),
    status: Object.values(EmissionSourcesStatus),
    caracterisations: Object.values(EmissionSourceCaracterisation),
  })

  const updateFilters = useCallback(
    (values: Partial<EmissionSourcesFilters>) => setEmissionSourcesFilters((prev) => ({ ...prev, ...values })),
    [],
  )

  const fuse = useMemo(
    () => new Fuse(emissionSources, getEmissionSourcesFuseOptions(tQuality, tUnit, locale)),
    [emissionSources, locale, tQuality, tUnit],
  )

  const filteredSources = useMemo(
    () =>
      emissionSourcesFilters.search
        ? fuse.search(emissionSourcesFilters.search).map(({ item }) => item)
        : emissionSources,
    [emissionSources, emissionSourcesFilters.search, fuse],
  )

  return (
    <>
      <StudyPostsBlock
        post={post}
        study={study}
        display={showInfography}
        setDisplay={setShowInfography}
        emissionSources={emissionSources}
        filters={emissionSourcesFilters}
        setFilters={updateFilters}
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
