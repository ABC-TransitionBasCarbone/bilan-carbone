'use client'

import MultiSelectAll from '@/components/base/MultiSelectAll'
import { PostSubPostFilter } from '@/components/form/PostSubPostFilter'
import { TagFilter } from '@/components/form/TagFilter'
import SelectStudySite from '@/components/study/site/SelectStudySite'
import { FullStudy, StudyTagFamilyWithTags } from '@/db/study'
import { environmentSubPostsMapping, Post, subPostsByPost } from '@/services/posts'
import { FormControl, InputLabel } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef } from 'react'

interface Props {
  study: Pick<FullStudy, 'tagFamilies' | 'organizationVersion' | 'sites'>
  selectedSiteIds: string[]
  selectedPostIds: string[]
  selectedTagIds: string[]
  onSiteFilterChange: (ids: string[]) => void
  onPostFilterChange: (ids: string[]) => void
  onTagFilterChange: (ids: string[]) => void
  filtersMounted: boolean
  showSiteFilter?: boolean
}

const TransitionPlanFilters = ({
  study,
  selectedSiteIds,
  selectedPostIds,
  selectedTagIds,
  onSiteFilterChange,
  onPostFilterChange,
  onTagFilterChange,
  filtersMounted,
  showSiteFilter = false,
}: Props) => {
  const tCommon = useTranslations('common')
  const initializedRef = useRef(false)

  const { envPosts, envSubPosts } = useMemo(() => {
    const envSubPostsByPost = environmentSubPostsMapping[study.organizationVersion.environment]
    const posts = Object.keys(envSubPostsByPost) as Post[]
    const subPosts = posts.reduce((acc, post) => acc.concat(subPostsByPost[post] || []), [] as SubPost[])
    return {
      envPosts: posts,
      envSubPosts: Array.from(new Set(subPosts)),
    }
  }, [study.organizationVersion.environment])

  const allTagIds = useMemo(
    () =>
      study.tagFamilies
        .flatMap((family) => family.tags.map((tag) => tag.id))
        .concat(study.tagFamilies.some((f) => f.name !== 'DEFAULT_FAMILY_TAG') ? ['other'] : []),
    [study.tagFamilies],
  )

  useEffect(() => {
    if (!filtersMounted || initializedRef.current) {
      return
    }
    initializedRef.current = true
    if (selectedPostIds.length === 0 && envSubPosts.length > 0) {
      onPostFilterChange(envSubPosts.map((sp) => String(sp)))
    }
    if (selectedTagIds.length === 0 && allTagIds.length > 0) {
      onTagFilterChange(allTagIds)
    }
    if (showSiteFilter && selectedSiteIds.length === 0 && study.sites.length > 0) {
      onSiteFilterChange(study.sites.map((s) => s.site.id))
    }
  }, [filtersMounted]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedSubPosts = useMemo(
    () => selectedPostIds.filter((id): id is SubPost => Object.values(SubPost).includes(id as SubPost)),
    [selectedPostIds],
  )

  const sites = useMemo(() => study.sites.map((s) => ({ id: s.site.id, name: s.site.name })), [study.sites])

  return (
    <div className="flex gapped1">
      {showSiteFilter ? (
        <FormControl disabled={sites.length === 0}>
          <InputLabel id="transition-plan-site-filter-label" shrink>
            {tCommon('sites')}
          </InputLabel>
          <MultiSelectAll
            id="transition-plan-site-filter"
            values={selectedSiteIds}
            allValues={sites.map((s) => s.id)}
            setValues={onSiteFilterChange}
            getLabel={(id) => sites.find((s) => s.id === id)?.name ?? id}
            label={tCommon('sites')}
          />
        </FormControl>
      ) : (
        <SelectStudySite sites={study.sites} siteSelectionDisabled isTransitionPlan />
      )}
      <PostSubPostFilter
        envPosts={envPosts}
        envSubPosts={envSubPosts}
        selectedSubPosts={selectedSubPosts}
        onChange={(subPosts) => onPostFilterChange(subPosts.map((sp) => String(sp)))}
      />
      <TagFilter
        tagFamilies={study.tagFamilies as StudyTagFamilyWithTags[]}
        selectedTagIds={selectedTagIds}
        onChange={onTagFilterChange}
      />
    </div>
  )
}

export default TransitionPlanFilters
