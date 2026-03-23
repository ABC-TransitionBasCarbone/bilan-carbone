'use client'

import MultiSelectAll from '@/components/base/MultiSelectAll'
import { PostSubPostFilter } from '@/components/form/PostSubPostFilter'
import { TagFilter } from '@/components/form/TagFilter'
import { FullStudy, StudyTagFamilyWithTags } from '@/db/study'
import { environmentSubPostsMapping, Post, subPostsByPost } from '@/services/posts'
import { FormControl, InputLabel } from '@mui/material'
import { SubPost } from  '@repo/db-common/enums'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef } from 'react'
import styles from './TransitionPlanFilters.module.css'

interface Props {
  study: Pick<FullStudy, 'tagFamilies' | 'organizationVersion' | 'sites'>
  selectedSiteIds: string[]
  selectedSubPosts: SubPost[]
  selectedTagIds: string[]
  onSiteFilterChange: (ids: string[]) => void
  onSubPostFilterChange: (subPosts: SubPost[]) => void
  onTagFilterChange: (ids: string[]) => void
  filtersMounted: boolean
}

const TransitionPlanFilters = ({
  study,
  selectedSiteIds,
  selectedSubPosts,
  selectedTagIds,
  onSiteFilterChange,
  onSubPostFilterChange,
  onTagFilterChange,
  filtersMounted,
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
    if (selectedSubPosts.length === 0 && envSubPosts.length > 0) {
      onSubPostFilterChange(envSubPosts)
    }
    if (selectedTagIds.length === 0 && allTagIds.length > 0) {
      onTagFilterChange(allTagIds)
    }
    if (selectedSiteIds.length === 0 && study.sites.length > 0) {
      onSiteFilterChange(study.sites.map((s) => s.site.id))
    }
  }, [
    allTagIds,
    envSubPosts,
    filtersMounted,
    onSubPostFilterChange,
    onSiteFilterChange,
    onTagFilterChange,
    selectedSubPosts.length,
    selectedSiteIds.length,
    selectedTagIds.length,
    study.sites,
  ])

  const sites = useMemo(() => study.sites.map((s) => ({ id: s.site.id, name: s.site.name })), [study.sites])

  return (
    <div className="flex gapped1">
      <FormControl disabled={sites.length === 0} className={styles.siteFilter}>
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
      <PostSubPostFilter
        envPosts={envPosts}
        envSubPosts={envSubPosts}
        selectedSubPosts={selectedSubPosts}
        onChange={onSubPostFilterChange}
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
