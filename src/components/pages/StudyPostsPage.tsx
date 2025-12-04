'use client'

import { FullStudy } from '@/db/study'
import { getCaracterisationsBySubPost } from '@/services/emissionSource'
import { Post, subPostsByPost } from '@/services/posts'
import { EmissionSourcesStatus, getEmissionSourceStatus } from '@/services/study'
import { EmissionSourcesFilters } from '@/types/filters'
import { unique } from '@/utils/array'
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

  const initialTags = useMemo(
    () =>
      study.tagFamilies.reduce((res, tagFamily) => [...res, ...tagFamily.tags.map((tag) => tag.id)], [] as string[]),
    [study.tagFamilies],
  )

  const subPosts = useMemo(() => Object.values(subPostsByPost[post]), [post])

  const initialCaracterisations = useMemo(
    () =>
      unique(
        subPosts.reduce(
          (res, subPost) => [
            ...res,
            ...getCaracterisationsBySubPost(subPost, study.exports, study.organizationVersion.environment),
          ],
          [] as EmissionSourceCaracterisation[],
        ),
      ),

    [study.exports, study.organizationVersion.environment, subPosts],
  )

  const [filters, setFilters] = useState<EmissionSourcesFilters>({
    search: '',
    subPosts: subPosts,
    tags: initialTags,
    activityData: Object.values(EmissionSourceType),
    status: Object.values(EmissionSourcesStatus),
    caracterisations: initialCaracterisations,
  })

  const updateFilters = useCallback(
    (values: Partial<EmissionSourcesFilters>) => setFilters((prev) => ({ ...prev, ...values })),
    [],
  )

  const fuse = useMemo(
    () => new Fuse(emissionSources, getEmissionSourcesFuseOptions(tQuality, tUnit, locale)),
    [emissionSources, locale, tQuality, tUnit],
  )

  const filteredSources = useMemo(() => {
    const searched = filters.search ? fuse.search(filters.search).map(({ item }) => item) : emissionSources

    let filtered = searched.filter(
      (emissionSource) =>
        filters.status.includes(
          getEmissionSourceStatus(study, emissionSource, study.organizationVersion.environment),
        ) && filters.subPosts.includes(emissionSource.subPost),
    )

    const filterOnTags = filters.tags.length && filters.tags.length !== initialTags.length
    if (filterOnTags) {
      filtered = filtered.filter(
        (emissionSource) =>
          emissionSource.emissionSourceTags.length &&
          emissionSource.emissionSourceTags.some((emissionSourceTag) =>
            filters.tags.includes(emissionSourceTag.tag.id),
          ),
      )
    }

    const filterOnActivityData =
      filters.activityData.length && filters.activityData.length !== Object.keys(EmissionSourceType).length
    if (filterOnActivityData) {
      filtered = filtered.filter(
        (emissionSource) => emissionSource.type && filters.activityData.includes(emissionSource.type),
      )
    }

    const filterOnCaracterisation =
      filters.caracterisations.length &&
      filters.caracterisations.length === Object.keys(EmissionSourceCaracterisation).length
    if (filterOnCaracterisation) {
      filtered = filtered.filter(
        (emissionSource) =>
          emissionSource.caracterisation && filters.caracterisations.includes(emissionSource.caracterisation),
      )
    }
    return filtered
  }, [emissionSources, filters, fuse, initialTags.length, study])

  return (
    <>
      <StudyPostsBlock
        post={post}
        study={study}
        display={showInfography}
        setDisplay={setShowInfography}
        emissionSources={emissionSources}
        filters={filters}
        setFilters={updateFilters}
        caracterisationOptions={initialCaracterisations}
      >
        {showInfography && <StudyPostInfography study={study} studySite={studySite} user={user} />}
        <SubPosts
          subPosts={filters.subPosts}
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
