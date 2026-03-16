'use client'

import MultiSelectAll from '@/components/base/MultiSelectAll'
import { PostSubPostFilter } from '@/components/form/PostSubPostFilter'
import { TagFilter } from '@/components/form/TagFilter'
import { getEnvPosts, getEnvSubPosts } from '@/services/posts'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { FormControl, FormHelperText, InputLabel } from '@mui/material'
import { SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './ScopeSelectors.module.css'

export type TagFamily = {
  id: string
  name: string
  studyId: string
  tags: Array<{ id: string; name: string; color: string | null }>
}

interface Props {
  siteIds: string[]
  tagIds: string[]
  subPosts: SubPost[]
  sites: Array<{ id: string; name: string }>
  tagFamilies: TagFamily[]
  onSiteIdsChange: (value: string[]) => void
  onTagIdsChange: (value: string[]) => void
  onSubPostsChange: (value: SubPost[]) => void
  isOtherDisabled?: boolean
  siteIdsError?: string
  subPostsError?: string
  tagIdsError?: string
}

const ScopeSelectors = ({
  siteIds,
  tagIds,
  subPosts,
  sites,
  tagFamilies,
  onSiteIdsChange,
  onTagIdsChange,
  onSubPostsChange,
  isOtherDisabled = false,
  siteIdsError,
  subPostsError,
  tagIdsError,
}: Props) => {
  const tCommon = useTranslations('common')
  const { environment } = useAppEnvironmentStore()

  const envPosts = getEnvPosts(environment)
  const envSubPosts = getEnvSubPosts(environment)

  return (
    <div className={classNames('grid', 'gapped1', styles.scopeGrid)}>
      <div className="flex-col">
        <FormControl fullWidth disabled={sites.length === 0}>
          <InputLabel id={'site-selector-label'} shrink={true}>
            {tCommon('sites')}
          </InputLabel>
          <MultiSelectAll
            id="scope-sites"
            values={siteIds}
            allValues={sites.map((s) => s.id)}
            setValues={onSiteIdsChange}
            getLabel={(id) => sites.find((s) => s.id === id)?.name || id}
            label={tCommon('sites')}
          />
          {siteIdsError && <FormHelperText error>{siteIdsError}</FormHelperText>}
        </FormControl>
      </div>

      <div className="flex-col">
        <FormControl fullWidth>
          <PostSubPostFilter
            className={classNames('w100', styles.postSubPostFilter)}
            envPosts={envPosts}
            envSubPosts={envSubPosts}
            selectedSubPosts={subPosts}
            onChange={onSubPostsChange}
            showSeparateLabel={false}
          />
          {subPostsError && <FormHelperText error>{subPostsError}</FormHelperText>}
        </FormControl>
      </div>

      <div className="flex-col">
        <TagFilter
          className={classNames('w100', styles.tagFilter)}
          tagFamilies={tagFamilies}
          selectedTagIds={tagIds}
          onChange={onTagIdsChange}
          showSeparateLabel={false}
          isOtherDisabled={isOtherDisabled}
        />
        {tagIdsError && <FormHelperText error>{tagIdsError}</FormHelperText>}
      </div>
    </div>
  )
}

export default ScopeSelectors
