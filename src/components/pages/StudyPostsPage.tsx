'use client'

import { FullStudy } from '@/db/study'
import { getCaracterisationsBySubPost } from '@/services/emissionSource'
import { Post, subPostsByPost } from '@/services/posts'
import { EmissionSourcesStatus, getEmissionSourceStatus } from '@/services/study'
import { EmissionSourcesFilters, EmissionSourcesSort } from '@/types/filters'
import { unique } from '@/utils/array'
import { getEmissionSourcesFuseOptions, getSortedEmissionSources } from '@/utils/emissionSources'
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
  const [sort, setSort] = useState<EmissionSourcesSort>({ field: undefined, order: 'asc' })

  const updateFilters = useCallback(
    (values: Partial<EmissionSourcesFilters>) => setFilters((prev) => ({ ...prev, ...values })),
    [],
  )
  const updateSort = useCallback(
    (field: EmissionSourcesSort['field'], order: EmissionSourcesSort['order']) => setSort({ field, order }),
    [],
  )

  const fuse = useMemo(
    () => new Fuse(emissionSources, getEmissionSourcesFuseOptions(tQuality, tUnit, locale)),
    [emissionSources, locale, tQuality, tUnit],
  )

  const filteredSources = useMemo(() => {
    const searched = filters.search ? fuse.search(filters.search).map(({ item }) => item) : emissionSources
    let filtered = searched

    if (filters.subPosts.length !== subPosts.length) {
      filtered = filtered.filter((emissionSource) => filters.subPosts.includes(emissionSource.subPost))
    }

    if (filters.status.length !== Object.values(EmissionSourcesStatus).length) {
      filtered = filtered.filter((emissionSource) =>
        filters.status.includes(getEmissionSourceStatus(study, emissionSource, study.organizationVersion.environment)),
      )
    }

    if (filters.tags.length !== initialTags.length) {
      if (!filters.tags.length) {
        filtered = filtered.filter((emissionSources) => !emissionSources.emissionSourceTags.length)
      } else {
        filtered = filtered.filter(
          (emissionSource) =>
            emissionSource.emissionSourceTags.length &&
            emissionSource.emissionSourceTags.some((emissionSourceTag) =>
              filters.tags.includes(emissionSourceTag.tag.id),
            ),
        )
      }
    }

    if (filters.activityData.length !== Object.keys(EmissionSourceType).length) {
      if (!filters.activityData.length) {
        filtered = filtered.filter((emissionSource) => !emissionSource.type)
      } else {
        filtered = filtered.filter(
          (emissionSource) => emissionSource.type && filters.activityData.includes(emissionSource.type),
        )
      }
    }

    if (filters.caracterisations.length !== initialCaracterisations.length) {
      if (!filters.caracterisations.length) {
        filtered = filtered.filter((emissionSource) => !emissionSource.caracterisation)
      } else {
        filtered = filtered.filter(
          (emissionSource) =>
            emissionSource.caracterisation && filters.caracterisations.includes(emissionSource.caracterisation),
        )
      }
    }

    return getSortedEmissionSources(filtered, sort, study.organizationVersion.environment, locale)
  }, [
    emissionSources,
    filters,
    sort,
    fuse,
    subPosts.length,
    initialTags.length,
    initialCaracterisations.length,
    study,
    locale,
  ])

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
        sort={sort}
        setSort={updateSort}
      >
        {showInfography && <StudyPostInfography study={study} studySite={studySite} user={user} />}
        <SubPosts
          post={post}
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
